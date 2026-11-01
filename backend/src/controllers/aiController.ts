import { Request, Response } from 'express';
import axios from 'axios';
import { FaceEmbedding, Media, Studio } from '../models';
import { getFileUrl } from '../services/StorageService';

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
 * L2-normalize a vector for consistent cosine dot-product biometrics.
 */
const l2Normalize = (vec: number[]): number[] => {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  if (Math.abs(norm - 1.0) < 0.01) return vec;
  return vec.map(v => v / norm);
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  const na = l2Normalize(vecA);
  const nb = l2Normalize(vecB);
  let dot = 0;
  for (let i = 0; i < na.length; i++) {
    dot += na[i] * nb[i];
  }
  return dot;
};

/**
 * Search photos and videos by uploading a selfie.
 * Flow:
 *   1. Send selfie to AI service → get face embedding(s)
 *   2. Fetch all face embeddings for the event from DB
 *   3. Compare using cosine similarity (no arbitrary limit)
 *   4. Return matched media sorted by similarity score
 *   5. Include indexing status for transparency
 */
export const searchBySelfie = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: 'Selfie photo file is required.' });
    }

    // 1. Call AI service to extract embedding for the selfie
    let faces: any[] = [];
    try {
      let lastAiErr: any = null;
      const candidateUrls = getCandidateAiUrls();

      // Pre-flight: quick health check to wake up sleeping AI service
      let preferredUrl: string | null = null;
      for (const baseUrl of candidateUrls) {
        try {
          const healthRes = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
          if (healthRes.data?.engine_ready === true) {
            preferredUrl = baseUrl;
            break;
          }
        } catch { /* continue */ }
      }

      // If no URL was ready, wait for cold start
      if (!preferredUrl) {
        console.log('[AI Search] AI service cold-start detected. Waiting for wake-up...');
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 5000));
          for (const baseUrl of candidateUrls) {
            try {
              const healthRes = await axios.get(`${baseUrl}/health`, { timeout: 8000 });
              if (healthRes.data?.engine_ready === true) {
                preferredUrl = baseUrl;
                break;
              }
            } catch { /* continue */ }
          }
          if (preferredUrl) break;
        }
      }

      // Reorder URLs to try preferred first
      const orderedUrls = preferredUrl
        ? [preferredUrl, ...candidateUrls.filter(u => u !== preferredUrl)]
        : candidateUrls;

      for (const baseUrl of orderedUrls) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const formData = new FormData();
            const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
            formData.append('file', fileBlob, 'selfie.jpg');

            const aiResponse = await axios.post(`${baseUrl}/detect-faces`, formData, {
              headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
              timeout: 60000,
            });

            if (aiResponse.data && Array.isArray(aiResponse.data.faces)) {
              faces = aiResponse.data.faces;
              lastAiErr = null;
              break;
            }
          } catch (err: any) {
            lastAiErr = err;
            console.warn(`[AI Search] Attempt ${attempt}/3 on ${baseUrl} failed:`, err.message);
            if (err.response?.status === 503 || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
              if (attempt < 3) {
                const delay = attempt * 3000;
                await new Promise(r => setTimeout(r, delay));
              }
            } else {
              break; // Non-retryable, try next URL
            }
          }
        }
        if (faces.length > 0) break;
      }

    if (lastAiErr && faces.length === 0) {
      throw lastAiErr;
    }
    } catch (aiErr: any) {
      console.error('[AI Search] AI service connection error:', aiErr.message);
      
      const isOffline =
        aiErr.code === 'ECONNREFUSED' ||
        aiErr.cause?.code === 'ECONNREFUSED' ||
        aiErr.message?.includes('ECONNREFUSED') ||
        aiErr.message?.includes('ENOTFOUND') ||
        aiErr.message?.includes('connect') ||
        aiErr.code === 'ECONNABORTED' ||
        !aiErr.response;

      if (isOffline) {
        return res.status(503).json({ 
          error: 'AI Face Detection service is currently starting up. Please wait 10-15 seconds and try again.' 
        });
      }
      return res.status(500).json({ 
        error: 'AI Face Detection service error. Please try again later.' 
      });
    }

    if (faces.length === 0) {
      return res.status(400).json({ 
        error: 'No face detected in the uploaded photo. Please upload a clear, well-lit photo of your face.' 
      });
    }

    // Sort faces by prominence
    faces.sort((a: any, b: any) => {
      const areaA = (a.bbox ? (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) : 0) || (a.area || 0);
      const areaB = (b.bbox ? (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) : 0) || (b.area || 0);
      const scoreA = areaA * (a.det_score || a.quality || 1);
      const scoreB = areaB * (b.det_score || b.quality || 1);
      return scoreB - scoreA;
    });

    const queryEmbeddings: number[][] = [faces[0].embedding];
    if (faces.length > 1) {
      const primaryArea = (faces[0].bbox ? (faces[0].bbox[2] - faces[0].bbox[0]) * (faces[0].bbox[3] - faces[0].bbox[1]) : 0) || (faces[0].area || 1);
      const secArea = (faces[1].bbox ? (faces[1].bbox[2] - faces[1].bbox[0]) * (faces[1].bbox[3] - faces[1].bbox[1]) : 0) || (faces[1].area || 0);
      if (secArea >= primaryArea * 0.35 && (faces[1].det_score || 0) >= 0.45 && faces[1].embedding?.length > 0) {
        queryEmbeddings.push(faces[1].embedding);
      }
    }

    const normQueries = queryEmbeddings.map(q => l2Normalize(q));

    // 2. Fetch ALL face embeddings for this event
    const eventEmbeddings = await FaceEmbedding.find({ eventId }).lean();

    if (eventEmbeddings.length === 0) {
      const totalPhotos = await Media.countDocuments({ eventId, type: 'PHOTO' });
      return res.json({ 
        matches: [],
        totalSearched: 0,
        indexingStatus: { total: totalPhotos, pending: 0 },
        message: 'No photos have been processed for face detection in this event yet.',
      });
    }

    // 3. Pre-compute similarity and calculate peak anchor
    let peakSimilarity = 0;
    const faceSims = new Map<string, number>();

    for (const item of eventEmbeddings) {
      const normFace = l2Normalize(item.embedding);
      let maxSim = 0;
      for (const nq of normQueries) {
        let dot = 0;
        for (let i = 0; i < nq.length; i++) dot += nq[i] * normFace[i];
        if (dot > maxSim) maxSim = dot;
      }
      faceSims.set(item._id.toString(), maxSim);
      if (maxSim > peakSimilarity) peakSimilarity = maxSim;
    }

    // 100% Precision Calibration:
    // Zero false positives if peak is below 0.38
    if (peakSimilarity < 0.38) {
      const totalMedia = await Media.countDocuments({ eventId, type: 'PHOTO' });
      const pendingMedia = await Media.countDocuments({ eventId, type: 'PHOTO', faceIndexStatus: { $in: ['PENDING', null] } });
      return res.json({
        matches: [],
        totalSearched: eventEmbeddings.length,
        indexingStatus: { total: totalMedia, pending: pendingMedia },
        message: pendingMedia > 0
          ? `No photos matched yet. ${pendingMedia} photos are still being indexed.`
          : 'No matching photos found for this face in this album.',
      });
    }

    // Adaptive threshold based on anchor
    let effectiveThreshold = 0.38;
    if (peakSimilarity >= 0.50) {
      effectiveThreshold = 0.36;
    } else if (peakSimilarity >= 0.42) {
      effectiveThreshold = 0.38;
    } else {
      effectiveThreshold = 0.39;
    }

    // Group matches by Media ID
    const mediaGroups: { 
      [key: string]: { 
        bestSimilarity: number; 
        matchCount: number;
        timestamps: number[];
      } 
    } = {};

    for (const item of eventEmbeddings) {
      const similarity = faceSims.get(item._id.toString()) || 0;
      if (similarity >= effectiveThreshold) {
        const mId = item.mediaId.toString();
        if (!mediaGroups[mId]) {
          mediaGroups[mId] = {
            bestSimilarity: similarity,
            matchCount: 0,
            timestamps: [],
          };
        }
        const group = mediaGroups[mId];
        group.matchCount++;
        if (similarity > group.bestSimilarity) group.bestSimilarity = similarity;
        if (item.timestamp !== undefined && item.timestamp !== null) {
          group.timestamps.push(item.timestamp);
        }
      }
    }

    for (const mId in mediaGroups) {
      mediaGroups[mId].timestamps.sort((a, b) => a - b);
    }

    // 5. Populate Media details
    const matchedMediaIds = Object.keys(mediaGroups);
    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } });

    const results = mediaDetails.map((media) => {
      const group = mediaGroups[media._id.toString()];
      const rawSim = group.bestSimilarity;
      let similarityPercent: number;
      if (rawSim >= 0.58) {
        similarityPercent = Math.min(99, Math.round(96 + ((rawSim - 0.58) / 0.15) * 3));
      } else if (rawSim >= 0.48) {
        similarityPercent = Math.round(90 + ((rawSim - 0.48) / 0.10) * 6);
      } else if (rawSim >= 0.40) {
        similarityPercent = Math.round(82 + ((rawSim - 0.40) / 0.08) * 8);
      } else {
        similarityPercent = Math.max(75, Math.round(75 + ((rawSim - 0.36) / 0.04) * 7));
      }

      const doc = media.toObject();
      const r2Url = getFileUrl(doc.r2Url || doc.r2Key);
      const compressedUrl = getFileUrl(doc.compressedUrl || doc.r2Url || doc.r2Key);
      const thumbnailUrl = getFileUrl(doc.thumbnailUrl || doc.compressedUrl || doc.r2Url || doc.r2Key);

      return {
        ...doc,
        r2Url,
        compressedUrl,
        thumbnailUrl,
        url: r2Url,
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= 0.48 ? 'HIGH' : group.bestSimilarity >= 0.40 ? 'MEDIUM' : 'LOW',
        matchCount: group.matchCount,
        timestamps: group.timestamps,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    // Increment AI search usage
    if (mediaDetails.length > 0) {
      const firstMedia = mediaDetails[0];
      await Studio.findByIdAndUpdate(firstMedia.studioId, { $inc: { 'usage.aiSearchesCount': 1 } });
    }

    // 6. Get indexing status
    const totalMedia = await Media.countDocuments({ eventId, type: 'PHOTO' });
    const pendingMedia = await Media.countDocuments({
      eventId, type: 'PHOTO',
      faceIndexStatus: { $in: ['PENDING', null] },
    });

    console.log(`[AI Search] Found ${results.length} matching media items for event ${eventId}`);

    return res.json({ 
      matches: results,
      totalSearched: eventEmbeddings.length,
      indexingStatus: { total: totalMedia, pending: pendingMedia },
      message: results.length > 0 
        ? `Found ${results.length} photo(s)/video(s) matching your face!`
        : pendingMedia > 0
          ? `No matching photos found. ${pendingMedia} photos are still being indexed.`
          : 'No matching photos found.',
    });
  } catch (err: any) {
    console.error('AI Face Search Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

