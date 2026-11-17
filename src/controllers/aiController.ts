import { Request, Response } from 'express';
import axios from 'axios';
import { FaceEmbedding, Media, Studio } from '../models';
import { getFileUrl } from '../services/StorageService';

const getCandidateAiUrls = (): string[] => {
  const envUrl = process.env.AI_SERVICE_URL;
  const list = [
    envUrl,
    'https://maraphotoes-ai.onrender.com',
  ].filter(Boolean) as string[];
  return Array.from(new Set(list));
};

// InsightFace (ArcFace buffalo_l) cosine similarity thresholds
// Set to 0.40 for strict, highly accurate "microscan" matching
const SIMILARITY_THRESHOLD = 0.40; // Minimum to count as a match
const HIGH_CONFIDENCE_THRESHOLD = 0.65; // High confidence match

/**
 * Calculates cosine similarity between two L2-normalized vectors.
 * For InsightFace ArcFace, values > 0.45 strongly indicate the same person.
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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

    // Use the first (usually largest/most prominent) detected face
    const queryEmbedding = faces[0].embedding;

    // 2. Fetch ALL face embeddings for this event (no limit)
    const eventEmbeddings = await FaceEmbedding.find({ eventId });

    if (eventEmbeddings.length === 0) {
      return res.json({ 
        matches: [],
        message: 'No photos have been processed for face detection in this event yet.',
      });
    }

    // 3. Compute similarities against ALL stored embeddings (no arbitrary limit)
    const matches: { mediaId: string; timestamp?: number; similarity: number }[] = [];
    
    for (const item of eventEmbeddings) {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        matches.push({
          mediaId: item.mediaId.toString(),
          timestamp: item.timestamp,
          similarity,
        });
      }
    }

    // 4. Group matches by Media ID (a single photo/video may have multiple face matches)
    const mediaGroups: { 
      [key: string]: { 
        bestSimilarity: number; 
        matchCount: number;
        timestamps: number[];
      } 
    } = {};

    for (const match of matches) {
      if (!mediaGroups[match.mediaId]) {
        mediaGroups[match.mediaId] = {
          bestSimilarity: match.similarity,
          matchCount: 0,
          timestamps: [],
        };
      }
      
      const group = mediaGroups[match.mediaId];
      group.matchCount++;
      
      if (match.similarity > group.bestSimilarity) {
        group.bestSimilarity = match.similarity;
      }
      
      if (match.timestamp !== undefined) {
        group.timestamps.push(match.timestamp);
      }
    }

    for (const mId in mediaGroups) {
      mediaGroups[mId].timestamps.sort((a, b) => a - b);
    }

    // 5. Populate Media details — ALL matches, no limit
    const matchedMediaIds = Object.keys(mediaGroups);
    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } });

    const results = mediaDetails.map((media) => {
      const group = mediaGroups[media._id.toString()];
      const similarityPercent = Math.round(group.bestSimilarity * 100);
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
        confidence: group.bestSimilarity >= HIGH_CONFIDENCE_THRESHOLD ? 'HIGH' : group.bestSimilarity >= 0.50 ? 'MEDIUM' : 'LOW',
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

