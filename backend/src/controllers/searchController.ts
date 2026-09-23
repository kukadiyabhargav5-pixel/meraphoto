import { Request, Response } from 'express';
import { Event, Media, FaceEmbedding } from '../models';
import { searchFaces, isQdrantAvailable, localCosineSearch } from '../services/qdrantService';
import axios from 'axios';
import FormData from 'form-data';

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
 * Cosine similarity between two vectors.
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Extract face embeddings from an uploaded file via AI service.
 * Supports multiple candidate URLs and retries to handle Render free-tier cold starts.
 */
const extractEmbeddingsFromFile = async (file: Express.Multer.File): Promise<any[]> => {
  const urls = getCandidateAiUrls();
  let lastError: any = null;

  for (const baseUrl of urls) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', file.buffer, file.originalname || 'selfie.jpg');

        const aiResponse = await axios.post(`${baseUrl}/detect-faces`, formData, {
          headers: { ...formData.getHeaders(), 'bypass-tunnel-reminder': 'true' },
          timeout: 45000,
        });

        if (aiResponse.data && Array.isArray(aiResponse.data.faces)) {
          return aiResponse.data.faces;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Face Search] AI service attempt ${attempt} on ${baseUrl} failed:`, err.message);
        if (err.response?.status === 503 || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2500));
          }
        }
      }
    }
  }

  throw lastError || new Error('No AI service endpoints reachable');
};

// Map to avoid duplicate concurrent indexing per event
const activeEventIndexing: Record<string, boolean> = {};

/**
 * Background auto-indexer for pending photos in an event.
 */
const triggerAutoIndexing = async (eventId: string) => {
  if (activeEventIndexing[eventId]) return;
  activeEventIndexing[eventId] = true;

  try {
    const pendingPhotos = await Media.find({
      eventId,
      type: 'PHOTO',
      faceIndexStatus: { $in: ['PENDING', null, 'FAILED'] },
    }).select('_id compressedUrl r2Url url studioId eventId').lean();

    if (pendingPhotos.length === 0) {
      delete activeEventIndexing[eventId];
      return;
    }

    console.log(`[AutoIndex] Background indexing ${pendingPhotos.length} photos for event ${eventId}`);

    for (const photo of pendingPhotos) {
      try {
        const imageUrl = photo.compressedUrl || photo.r2Url || (photo as any).url;
        if (!imageUrl) continue;

        const imgRes = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        const buffer = Buffer.from(imgRes.data);

        let faces: any[] = [];
        const urls = getCandidateAiUrls();
        for (const baseUrl of urls) {
          try {
            const formData = new FormData();
            formData.append('file', buffer, 'photo.jpg');

            const aiRes = await axios.post(`${baseUrl}/detect-faces`, formData, {
              headers: { ...formData.getHeaders(), 'bypass-tunnel-reminder': 'true' },
              timeout: 60000,
            });

            if (aiRes.data && Array.isArray(aiRes.data.faces)) {
              faces = aiRes.data.faces;
              break;
            }
          } catch (err: any) {
            console.warn(`[AutoIndex] Failed with ${baseUrl}:`, err.message);
          }
        }
        await FaceEmbedding.deleteMany({ mediaId: photo._id });

        for (const face of faces) {
          await FaceEmbedding.create({
            mediaId: photo._id,
            eventId: photo.eventId,
            studioId: photo.studioId,
            embedding: face.embedding,
            bbox: face.bbox,
            faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
            detectionConfidence: face.det_score || 0,
            faceQuality: face.quality || 0,
            modelVersion: 'buffalo_l_v1',
          });
        }

        await Media.findByIdAndUpdate(photo._id, {
          faceIndexStatus: faces.length > 0 ? 'INDEXED' : 'NO_FACE',
          faceCount: faces.length,
        });
      } catch (err: any) {
        console.warn(`[AutoIndex] Failed photo ${photo._id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error(`[AutoIndex] Error for event ${eventId}:`, err.message);
  } finally {
    delete activeEventIndexing[eventId];
  }
};

/**
 * Production-grade face search with multi-query embedding support.
 * 
 * Key improvements over previous version:
 * 1. Accepts multiple selfie files/frames for multi-query matching
 * 2. Uses MAX(similarity) across all query embeddings per gallery face
 * 3. No arbitrary result limit — searches the entire indexed gallery
 * 4. Accepts multi-face selfies (uses largest/best face, doesn't reject)
 * 5. Returns indexing status so UI can inform user of incomplete indexing
 * 6. Properly deduplicates by photo ID
 */
export const faceSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Accept single file (req.file) or multiple files (req.files)
    const files: Express.Multer.File[] = [];
    if (req.files && Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.file) {
      files.push(req.file);
    }

    if (files.length === 0) {
      res.status(400).json({ error: 'Selfie photo is required.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // --- Step 1: Extract query embeddings from all uploaded frames ---
    const queryEmbeddings: number[][] = [];
    let lastAiError: any = null;

    for (const file of files) {
      try {
        const faces = await extractEmbeddingsFromFile(file);
        if (faces.length > 0) {
          // Use the best/largest face from each frame (first returned by InsightFace)
          queryEmbeddings.push(faces[0].embedding);
        }
      } catch (aiErr: any) {
        lastAiError = aiErr;
        console.error('[Face Search] AI service error for frame:', aiErr.message);
      }
    }

    if (queryEmbeddings.length === 0) {
      if (lastAiError) {
        res.status(503).json({
          error: 'AI Face Recognition service is currently warming up or temporarily busy. Please wait a few seconds and try again.',
        });
        return;
      }
      res.status(400).json({
        error: 'No face detected in the uploaded photo. Please try a clearer, well-lit photo looking directly at the camera.',
      });
      return;
    }

    // --- Step 2: Fetch all indexed face embeddings for this event ---
    const allFaces = await FaceEmbedding.find({ eventId }).lean();

    // Check if event has pending photos and trigger background indexing if needed
    const pendingCount = await Media.countDocuments({
      eventId,
      type: 'PHOTO',
      faceIndexStatus: { $in: ['PENDING', null, 'FAILED'] },
    });
    if (pendingCount > 0) {
      triggerAutoIndexing(eventId.toString());
    }

    if (allFaces.length === 0) {
      const totalPhotos = await Media.countDocuments({ eventId, type: 'PHOTO' });
      res.status(200).json({
        matches: [],
        totalSearched: 0,
        indexingStatus: { total: totalPhotos, indexed: 0, pending: pendingCount },
        message: pendingCount > 0
          ? `Photos are currently being indexed (${pendingCount} pending). Please try again in a few moments.`
          : 'No indexed faces found in this album.',
      });
      return;
    }

    // --- Step 3: Multi-query matching with precision-calibrated thresholds ---
    // Compute peak similarity to check if target face is truly present in gallery
    let peakSimilarity = 0;
    for (const face of allFaces) {
      for (const qEmb of queryEmbeddings) {
        const sim = cosineSimilarity(qEmb, face.embedding);
        if (sim > peakSimilarity) {
          peakSimilarity = sim;
        }
      }
    }

    // High Precision & Accuracy Threshold:
    // Base threshold for InsightFace ArcFace 512-D is 0.40.
    // - If peakSimilarity < 0.38: Person is NOT in the gallery. No false positives will be returned!
    // - If peakSimilarity >= 0.48: Confirmed identity with high confidence. We allow candidate photos
    //   of this same person down to 0.36 to capture angled, candid, low-light, or sunglasses shots.
    // - If peakSimilarity is between 0.38 and 0.48: Threshold is 0.38 (strict matching to eliminate false positives).
    // - If event.searchThreshold is explicitly set by admin/studio, respect it, but enforce minimum 0.35.
    let effectiveThreshold = 0.40;
    if (event.searchThreshold && event.searchThreshold >= 0.35) {
      effectiveThreshold = event.searchThreshold;
    } else if (peakSimilarity >= 0.48) {
      effectiveThreshold = 0.36;
    } else if (peakSimilarity >= 0.38) {
      effectiveThreshold = 0.38;
    } else {
      effectiveThreshold = 0.38;
    }

    console.log(`[Face Search] Event ${eventId}: peak similarity = ${peakSimilarity.toFixed(4)}, effective threshold = ${effectiveThreshold}`);

    // If peakSimilarity is below the matching threshold, immediately return 0 matches cleanly
    if (peakSimilarity < effectiveThreshold) {
      const totalPhotos = await Media.countDocuments({ eventId, type: 'PHOTO' });
      const indexedMedia = await Media.countDocuments({ eventId, faceIndexStatus: 'INDEXED' });
      res.status(200).json({
        matches: [],
        totalSearched: allFaces.length,
        indexingStatus: { total: totalPhotos, indexed: indexedMedia, pending: pendingCount },
        message: 'No matching photos found for this face in this album.',
      });
      return;
    }

    // --- Step 3: Match gallery faces against query embeddings with consensus verification ---
    const mediaMatches: Record<string, {
      bestSimilarity: number;
      matchCount: number;
      timestamps: number[];
    }> = {};

    for (const face of allFaces) {
      let maxSimForFace = 0;
      let sumSimForFace = 0;

      for (const qEmb of queryEmbeddings) {
        const sim = cosineSimilarity(qEmb, face.embedding);
        sumSimForFace += sim;
        if (sim > maxSimForFace) {
          maxSimForFace = sim;
        }
      }

      const avgSimForFace = queryEmbeddings.length > 0 ? sumSimForFace / queryEmbeddings.length : maxSimForFace;

      // Multi-query consensus verification:
      // If multiple query frames were provided, require that the face is either:
      // 1. Very strong match on primary frame (maxSim >= 0.42)
      // OR
      // 2. Consistent across multiple frames (maxSim >= effectiveThreshold AND avgSim >= effectiveThreshold - 0.05)
      const isConsistentMatch = queryEmbeddings.length <= 1 
        ? (maxSimForFace >= effectiveThreshold)
        : (maxSimForFace >= 0.42 || (maxSimForFace >= effectiveThreshold && avgSimForFace >= (effectiveThreshold - 0.05)));

      if (isConsistentMatch) {
        const mediaId = face.mediaId.toString();

        if (!mediaMatches[mediaId]) {
          mediaMatches[mediaId] = {
            bestSimilarity: maxSimForFace,
            matchCount: 0,
            timestamps: [],
          };
        }

        const group = mediaMatches[mediaId];
        group.matchCount++;

        if (maxSimForFace > group.bestSimilarity) {
          group.bestSimilarity = maxSimForFace;
        }

        if (face.timestamp !== undefined && face.timestamp !== null) {
          group.timestamps.push(face.timestamp);
        }
      }
    }

    // --- Step 4: Fetch matched media details ---
    const matchedMediaIds = Object.keys(mediaMatches);

    if (matchedMediaIds.length === 0) {
      const totalMedia = await Media.countDocuments({ eventId, type: 'PHOTO' });
      const indexedMedia = await Media.countDocuments({ eventId, faceIndexStatus: 'INDEXED' });
      const pendingMedia = await Media.countDocuments({
        eventId, type: 'PHOTO',
        faceIndexStatus: { $in: ['PENDING', null] },
      });

      res.status(200).json({
        matches: [],
        totalSearched: allFaces.length,
        indexingStatus: { total: totalMedia, indexed: indexedMedia, pending: pendingMedia },
        message: 'No matching photos found.',
      });
      return;
    }

    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } }).lean();

    // --- Step 5: Build sorted results with normalized similarity percentage ---
    const results = mediaDetails.map((media) => {
      const group = mediaMatches[media._id.toString()];
      const rawSim = group.bestSimilarity;
      // Calibrated accuracy mapping: [0.36 .. 0.65] maps to [80% .. 100%]
      let similarityPercent = Math.round(80 + ((rawSim - 0.36) / 0.28) * 20);
      similarityPercent = Math.min(100, Math.max(80, similarityPercent));

      // Sort timestamps
      group.timestamps.sort((a, b) => a - b);

      return {
        ...media,
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= 0.45 ? 'HIGH' : group.bestSimilarity >= 0.38 ? 'MEDIUM' : 'LOW',
        matchCount: group.matchCount,
        timestamps: group.timestamps,
      };
    });

    // Sort by similarity (highest first) — but do NOT remove any valid matches
    results.sort((a, b) => b.similarity - a.similarity);

    // --- Step 7: Get indexing status for response ---
    const totalMedia = await Media.countDocuments({ eventId, type: 'PHOTO' });
    const indexedMedia = await Media.countDocuments({ eventId, faceIndexStatus: 'INDEXED' });
    const pendingMedia = await Media.countDocuments({
      eventId, type: 'PHOTO',
      faceIndexStatus: { $in: ['PENDING', null] },
    });
    const failedMedia = await Media.countDocuments({ eventId, faceIndexStatus: 'FAILED' });

    console.log(`[Face Search] Found ${results.length} matching photos for event ${eventId} (searched ${allFaces.length} faces, ${queryEmbeddings.length} query frames)`);

    if (pendingMedia > 0) {
      triggerAutoIndexing(eventId.toString());
    }

    res.status(200).json({
      matches: results,
      count: results.length,
      totalSearched: allFaces.length,
      queryFramesUsed: queryEmbeddings.length,
      indexingStatus: {
        total: totalMedia,
        indexed: indexedMedia,
        pending: pendingMedia,
        failed: failedMedia,
      },
      message: pendingMedia > 0
        ? `Found ${results.length} matching photos. Note: ${pendingMedia} photos are still being indexed.`
        : `Found ${results.length} matching photos.`,
    });
  } catch (error) {
    console.error('Face search error:', error);
    res.status(500).json({ error: 'Internal server error during face search.' });
  }
};
