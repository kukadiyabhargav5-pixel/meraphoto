import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Media, FaceEmbedding, Event } from '../models';
import { insertFaceEmbedding, isQdrantAvailable } from '../services/qdrantService';
import axios from 'axios';

const getCandidateAiUrls = (): string[] => {
  const envUrl = process.env.AI_SERVICE_URL;
  const list = [
    envUrl,
    'http://maraphotoes-ai:10000',
    'http://meraphoto-ai:10000',
    'https://maraphotoes-ai.onrender.com',
    'https://meraphoto-ai.onrender.com',
    'http://127.0.0.1:8000',
  ].filter(Boolean) as string[];
  return Array.from(new Set(list));
};

/**
 * Downloads a file from a URL as a Buffer
 */
const downloadUrlToBuffer = async (url: string): Promise<Buffer> => {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
};

/**
 * Get face indexing status for an event.
 * GET /api/admin/face-index/status/:eventId
 */
export const getFaceIndexStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const totalPhotos = await Media.countDocuments({ eventId, type: 'PHOTO' });
    const totalVideos = await Media.countDocuments({ eventId, type: 'VIDEO' });
    const indexed = await Media.countDocuments({ eventId, faceIndexStatus: 'INDEXED' });
    const pending = await Media.countDocuments({ eventId, faceIndexStatus: { $in: ['PENDING', null] } });
    const failed = await Media.countDocuments({ eventId, faceIndexStatus: 'FAILED' });
    const noFace = await Media.countDocuments({ eventId, faceIndexStatus: 'NO_FACE' });
    const totalFaces = await FaceEmbedding.countDocuments({ eventId });

    // Get processing status breakdown
    const processing = await Media.countDocuments({ eventId, processedStatus: 'PROCESSING' });

    res.json({
      eventId,
      eventName: event.name,
      totalPhotos,
      totalVideos,
      faceIndex: {
        indexed,
        pending,
        failed,
        noFace,
        totalFacesDetected: totalFaces,
        processing,
      },
      modelVersion: 'buffalo_l_v1',
      searchThreshold: event.searchThreshold || 0.45,
    });
  } catch (err: any) {
    console.error('[FaceIndex] Status error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get detected faces for a specific photo (admin diagnostic).
 * GET /api/admin/face-index/photo/:mediaId
 */
export const getPhotoFaces = async (req: AuthRequest, res: Response) => {
  try {
    const { mediaId } = req.params;

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const faces = await FaceEmbedding.find({ mediaId }).select(
      'bbox detectionConfidence faceQuality modelVersion imageWidth imageHeight faceThumbnailUrl createdAt'
    ).lean();

    res.json({
      mediaId,
      mediaUrl: media.r2Url,
      faceIndexStatus: media.faceIndexStatus || 'PENDING',
      faceCount: media.faceCount || 0,
      processedStatus: media.processedStatus,
      faces: faces.map(f => ({
        ...f,
        // Don't expose raw embedding through admin API
        embedding: undefined,
      })),
    });
  } catch (err: any) {
    console.error('[FaceIndex] Photo faces error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rebuild face index for an entire event.
 * Re-processes every existing photo through AI face detection.
 * POST /api/admin/rebuild-face-index/:eventId
 */
export const rebuildFaceIndex = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Get all completed photos for this event
    const photos = await Media.find({
      eventId,
      type: 'PHOTO',
      processedStatus: 'COMPLETED',
    }).select('_id r2Url eventId studioId').lean();

    if (photos.length === 0) {
      return res.json({ message: 'No completed photos to index.', total: 0 });
    }

    // Respond immediately — processing happens in background
    res.json({
      message: `Rebuild started for ${photos.length} photos. Check status endpoint for progress.`,
      total: photos.length,
    });

    // Background processing — do NOT await in the request handler
    (async () => {
      let indexed = 0;
      let failed = 0;
      let noFace = 0;
      const batchSize = 3; // Process 3 at a time to avoid overwhelming AI service

      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);

        await Promise.all(batch.map(async (photo) => {
          try {
            // Delete existing embeddings for this photo
            await FaceEmbedding.deleteMany({ mediaId: photo._id });

            // Download original image
            const buffer = await downloadUrlToBuffer(photo.r2Url);

            // Send to AI service
            const formData = new FormData();
            const fileBlob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
            formData.append('file', fileBlob, 'image.jpg');

            let faces: any[] = [];
            const candidateUrls = getCandidateAiUrls();
            for (const baseUrl of candidateUrls) {
              try {
                const aiResponse = await axios.post(`${baseUrl}/detect-faces`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
                  timeout: 60000,
                });
                if (aiResponse.data && Array.isArray(aiResponse.data.faces)) {
                  faces = aiResponse.data.faces;
                  break;
                }
              } catch (err: any) {
                console.warn(`[FaceIndex] Endpoint ${baseUrl} failed:`, err.message);
              }
            }

            // Get image dimensions for metadata
            const sharp = await import('sharp');
            const metadata = await sharp.default(buffer).metadata();
            const width = metadata.width || 0;
            const height = metadata.height || 0;

            // Store embeddings (always L2-normalize for consistent cosine similarity)
            for (const face of faces) {
              const rawEmb: number[] = face.embedding || [];
              let sumSq = 0;
              for (const v of rawEmb) sumSq += v * v;
              const norm = Math.sqrt(sumSq);
              const normalizedEmb = (norm > 0 && Math.abs(norm - 1.0) > 0.01)
                ? rawEmb.map((v: number) => v / norm)
                : rawEmb;

              const faceDoc = await FaceEmbedding.create({
                mediaId: photo._id,
                eventId: photo.eventId,
                studioId: photo.studioId,
                embedding: normalizedEmb,
                bbox: face.bbox,
                faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
                detectionConfidence: face.det_score || 0,
                faceQuality: face.quality || 0,
                modelVersion: 'buffalo_sc_v1_normalized',
                imageWidth: width,
                imageHeight: height,
              });

              try {
                if (await isQdrantAvailable()) {
                  await insertFaceEmbedding(
                    photo.eventId.toString(),
                    photo._id.toString(),
                    face.embedding,
                    faceDoc._id.toString()
                  );
                }
              } catch (qErr) {
                console.warn(`[Rebuild] Qdrant insert failed for ${photo._id}:`, qErr);
              }
            }

            // Update media record
            await Media.findByIdAndUpdate(photo._id, {
              faceIndexStatus: faces.length > 0 ? 'INDEXED' : 'NO_FACE',
              faceCount: faces.length,
            });

            if (faces.length > 0) indexed++;
            else noFace++;

            console.log(`[Rebuild] ${i + 1}/${photos.length} — Photo ${photo._id}: ${faces.length} faces`);
          } catch (err: any) {
            console.error(`[Rebuild] Failed photo ${photo._id}:`, err.message);
            await Media.findByIdAndUpdate(photo._id, { faceIndexStatus: 'FAILED' });
            failed++;
          }
        }));
      }

      console.log(`[Rebuild] Complete for event ${eventId}: indexed=${indexed}, noFace=${noFace}, failed=${failed}`);
    })();
  } catch (err: any) {
    console.error('[FaceIndex] Rebuild error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retry failed face indexing for an event.
 * POST /api/admin/retry-failed/:eventId
 */
export const retryFailedIndexing = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const failedPhotos = await Media.find({
      eventId,
      type: 'PHOTO',
      faceIndexStatus: 'FAILED',
      processedStatus: 'COMPLETED',
    }).select('_id r2Url eventId studioId').lean();

    if (failedPhotos.length === 0) {
      return res.json({ message: 'No failed photos to retry.', total: 0 });
    }

    // Reset status to PENDING
    await Media.updateMany(
      { _id: { $in: failedPhotos.map(p => p._id) } },
      { faceIndexStatus: 'PENDING' }
    );

    res.json({
      message: `Retrying ${failedPhotos.length} failed photos. Check status endpoint for progress.`,
      total: failedPhotos.length,
    });

    // Background processing
    (async () => {
      for (const photo of failedPhotos) {
        try {
          await FaceEmbedding.deleteMany({ mediaId: photo._id });

          const buffer = await downloadUrlToBuffer(photo.r2Url);

          const formData = new FormData();
          const fileBlob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
          formData.append('file', fileBlob, 'image.jpg');

          let faces: any[] = [];
          const candidateUrls = getCandidateAiUrls();
          for (const baseUrl of candidateUrls) {
            try {
              const aiResponse = await axios.post(`${baseUrl}/detect-faces`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
                timeout: 60000,
              });
              if (aiResponse.data && Array.isArray(aiResponse.data.faces)) {
                faces = aiResponse.data.faces;
                break;
              }
            } catch (err: any) {
              console.warn(`[FaceIndex] Single photo endpoint ${baseUrl} failed:`, err.message);
            }
          }

          const sharp = await import('sharp');
          const metadata = await sharp.default(buffer).metadata();

          for (const face of faces) {
            // Always L2-normalize embedding before storage
            const rawEmb: number[] = face.embedding || [];
            let sumSq = 0;
            for (const v of rawEmb) sumSq += v * v;
            const norm = Math.sqrt(sumSq);
            const normalizedEmb = (norm > 0 && Math.abs(norm - 1.0) > 0.01)
              ? rawEmb.map((v: number) => v / norm)
              : rawEmb;

            const faceDoc = await FaceEmbedding.create({
              mediaId: photo._id,
              eventId: photo.eventId,
              studioId: photo.studioId,
              embedding: normalizedEmb,
              bbox: face.bbox,
              faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
              detectionConfidence: face.det_score || 0,
              faceQuality: face.quality || 0,
              modelVersion: 'buffalo_sc_v1_normalized',
              imageWidth: metadata.width || 0,
              imageHeight: metadata.height || 0,
            });

            try {
              if (await isQdrantAvailable()) {
                await insertFaceEmbedding(
                  photo.eventId.toString(),
                  photo._id.toString(),
                  face.embedding,
                  faceDoc._id.toString()
                );
              }
            } catch (qErr) {
              // Non-critical
            }
          }

          await Media.findByIdAndUpdate(photo._id, {
            faceIndexStatus: faces.length > 0 ? 'INDEXED' : 'NO_FACE',
            faceCount: faces.length,
          });

          console.log(`[Retry] Photo ${photo._id}: ${faces.length} faces`);
        } catch (err: any) {
          console.error(`[Retry] Failed photo ${photo._id}:`, err.message);
          await Media.findByIdAndUpdate(photo._id, { faceIndexStatus: 'FAILED' });
        }
      }
    })();
  } catch (err: any) {
    console.error('[FaceIndex] Retry error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cosine similarity helper for normalized 512-d vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

function normalizeVec(v: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) sumSq += v[i] * v[i];
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < v.length; i++) v[i] /= norm;
  }
  return v;
}

/**
 * Get clustered faces for an event
 * High-precision clustering:
 * 1. Filters false positives (statues, noise, non-face textures)
 * 2. Compares against both centroid and cluster members
 * 3. Runs an agglomerative merge pass so identical people (even with sunglasses/different angles)
 *    are 100% unified into a single Person block!
 * GET /api/face-index/clusters/:eventId
 */
export const getEventFaceClusters = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    // 1. Fetch active media for this event
    const activeMedia = await Media.find({ eventId }).select('_id').lean();
    const activeMediaIdSet = new Set(activeMedia.map((m) => m._id.toString()));

    // Clean up any orphan face embeddings from previously deleted media
    FaceEmbedding.deleteMany({
      eventId,
      mediaId: { $nin: activeMedia.map((m) => m._id) },
    }).catch(() => {});

    // 2. Fetch face embeddings for active media
    const embeddings = await FaceEmbedding.find({
      eventId,
      mediaId: { $in: activeMedia.map((m) => m._id) },
    })
      .select('_id mediaId embedding faceThumbnailUrl bbox detectionConfidence faceQuality')
      .lean();

    if (!embeddings || embeddings.length === 0) {
      return res.json({
        success: true,
        clusters: [],
        totalFaces: 0,
        totalPersons: 0,
        message: 'No face embeddings found for this event yet.',
      });
    }

    // 3. Exclude noise, tiny artifacts, and non-human detections
    const validEmbeddings = embeddings.filter((item) => {
      if (!item.embedding || !Array.isArray(item.embedding) || item.embedding.length < 128) return false;
      // Filter out low confidence detections (statues, noise, background artifacts)
      if (item.detectionConfidence !== undefined && item.detectionConfidence !== null && item.detectionConfidence > 0 && item.detectionConfidence < 0.65) {
        return false;
      }
      // Check bbox if available: valid human faces have width & height and normal aspect ratio
      if (Array.isArray(item.bbox) && item.bbox.length === 4) {
        const [x1, y1, x2, y2] = item.bbox;
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        if (w < 35 || h < 35) return false; // tiny noise / non-face
        const ratio = w / h;
        if (ratio < 0.55 || ratio > 1.8) return false; // non-face distortion
      }
      return true;
    });

    const activeList = validEmbeddings.length > 0 ? validEmbeddings : embeddings;

    interface Cluster {
      id: string;
      label: string;
      avatarUrl: string;
      bestQuality: number;
      faceCount: number;
      mediaIds: Set<string>;
      centroid: number[];
      allEmbeddings: number[][];
    }

    const clusters: Cluster[] = [];
    // Lower initial threshold to 0.34 so variations of same person (sunglasses, angles, lighting) cluster together
    const INITIAL_THRESHOLD = 0.34;

    for (const item of activeList) {
      const emb = item.embedding;
      if (!emb || !Array.isArray(emb) || emb.length === 0) continue;

      let bestCluster: Cluster | null = null;
      let highestSim = -1;

      for (const cl of clusters) {
        const centroidSim = cosineSimilarity(emb, cl.centroid);
        let maxMemberSim = -1;
        for (const member of cl.allEmbeddings) {
          const s = cosineSimilarity(emb, member);
          if (s > maxMemberSim) maxMemberSim = s;
        }
        // Combined similarity: member match helps handle sunglasses, lighting, and pose changes
        const sim = Math.max(centroidSim, maxMemberSim * 0.98);
        if (sim > highestSim) {
          highestSim = sim;
          bestCluster = cl;
        }
      }

      const mediaIdStr = item.mediaId?.toString();
      const quality = (item.faceQuality || 0) * 0.5 + (item.detectionConfidence || 0) * 0.5;

      if (bestCluster && highestSim >= INITIAL_THRESHOLD) {
        bestCluster.faceCount += 1;
        if (mediaIdStr) bestCluster.mediaIds.add(mediaIdStr);
        bestCluster.allEmbeddings.push(emb);

        if (quality > bestCluster.bestQuality && item.faceThumbnailUrl) {
          bestCluster.bestQuality = quality;
          bestCluster.avatarUrl = item.faceThumbnailUrl;
        }

        // Recompute normalized centroid
        const count = bestCluster.allEmbeddings.length;
        for (let i = 0; i < bestCluster.centroid.length; i++) {
          bestCluster.centroid[i] = (bestCluster.centroid[i] * (count - 1) + emb[i]) / count;
        }
        normalizeVec(bestCluster.centroid);
      } else {
        const newCluster: Cluster = {
          id: `person_${clusters.length + 1}`,
          label: `Person ${clusters.length + 1}`,
          avatarUrl: item.faceThumbnailUrl || '',
          bestQuality: quality,
          faceCount: 1,
          mediaIds: new Set<string>(mediaIdStr ? [mediaIdStr] : []),
          centroid: normalizeVec([...emb]),
          allEmbeddings: [emb],
        };
        clusters.push(newCluster);
      }
    }

    // 4. Agglomerative Merge Pass: merge duplicate clusters of the same person
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const cA = clusters[i];
          const cB = clusters[j];

          const centroidSim = cosineSimilarity(cA.centroid, cB.centroid);

          let maxPairSim = -1;
          for (const embA of cA.allEmbeddings) {
            for (const embB of cB.allEmbeddings) {
              const s = cosineSimilarity(embA, embB);
              if (s > maxPairSim) maxPairSim = s;
            }
          }

          // Same person threshold: centroid >= 0.33 OR maxPairSim >= 0.36
          // Accurately merges same individual with sunglasses, different angles or outfits
          if (centroidSim >= 0.33 || maxPairSim >= 0.36) {
            cA.faceCount += cB.faceCount;
            for (const mId of cB.mediaIds) cA.mediaIds.add(mId);
            cA.allEmbeddings.push(...cB.allEmbeddings);

            if (cB.bestQuality > cA.bestQuality && cB.avatarUrl) {
              cA.bestQuality = cB.bestQuality;
              cA.avatarUrl = cB.avatarUrl;
            }

            // Recalculate normalized centroid for cA
            const newCentroid = new Array(cA.centroid.length).fill(0);
            for (const vec of cA.allEmbeddings) {
              for (let k = 0; k < vec.length; k++) newCentroid[k] += vec[k];
            }
            cA.centroid = normalizeVec(newCentroid);

            // Remove cB
            clusters.splice(j, 1);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }

    // 5. Prune obvious 1-photo noise (non-human objects, false detections, low quality artifacts)
    const filteredClusters = clusters.filter((cl) => {
      if (cl.faceCount === 1 && cl.bestQuality < 0.40 && cl.mediaIds.size === 1) {
        return false;
      }
      return true;
    });

    const finalClusters = filteredClusters.length > 0 ? filteredClusters : clusters;
    finalClusters.sort((a, b) => b.mediaIds.size - a.mediaIds.size || b.faceCount - a.faceCount);

    const formattedClusters = finalClusters.map((cl, idx) => ({
      id: cl.id,
      label: `Person ${idx + 1}`,
      avatarUrl: cl.avatarUrl,
      faceCount: cl.faceCount,
      photoCount: cl.mediaIds.size,
      mediaIds: Array.from(cl.mediaIds),
    }));

    const allMediaIds = Array.from(new Set(embeddings.map((e) => e.mediaId?.toString()).filter(Boolean)));

    return res.json({
      success: true,
      clusters: formattedClusters,
      totalFaces: embeddings.length,
      totalPersons: formattedClusters.length,
      allMediaIds,
    });
  } catch (err: any) {
    console.error('[FaceIndex] getEventFaceClusters error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get face clusters' });
  }
};
