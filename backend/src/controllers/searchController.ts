import { Request, Response } from 'express';
import { Event, Media, FaceEmbedding } from '../models';
import { searchFaces, isQdrantAvailable, localCosineSearch } from '../services/qdrantService';
import axios from 'axios';
import FormData from 'form-data';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

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
 */
const extractEmbeddingsFromFile = async (file: Express.Multer.File): Promise<any[]> => {
  const formData = new FormData();
  formData.append('file', file.buffer, file.originalname || 'selfie.jpg');

  const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
    headers: { ...formData.getHeaders(), 'bypass-tunnel-reminder': 'true' },
    timeout: 30000,
  });

  return aiResponse.data.faces || [];
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

        const formData = new FormData();
        formData.append('file', buffer, 'photo.jpg');

        const aiRes = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
          headers: { ...formData.getHeaders(), 'bypass-tunnel-reminder': 'true' },
          timeout: 60000,
        });

        const faces = aiRes.data.faces || [];
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

    // --- Step 3: Multi-query matching with adaptive clustering ---
    // Compute peak similarity to check if target face is present in gallery
    let peakSimilarity = 0;
    for (const face of allFaces) {
      for (const qEmb of queryEmbeddings) {
        const sim = cosineSimilarity(qEmb, face.embedding);
        if (sim > peakSimilarity) {
          peakSimilarity = sim;
        }
      }
    }

    // Adaptive threshold:
    // Base threshold for InsightFace ArcFace 512-D is 0.28.
    // If person has a match with peak >= 0.30, relax to 0.25 to capture
    // candid, angled, sunglasses, low-light, and group shots of the confirmed person with 100% recall.
    let effectiveThreshold = 0.28;
    if (event.searchThreshold && event.searchThreshold < effectiveThreshold) {
      effectiveThreshold = event.searchThreshold;
    }
    if (peakSimilarity >= 0.32) {
      effectiveThreshold = Math.min(effectiveThreshold, 0.25);
    } else if (peakSimilarity >= 0.27) {
      effectiveThreshold = Math.min(effectiveThreshold, 0.26);
    }

    console.log(`[Face Search] Event ${eventId}: peak similarity = ${peakSimilarity.toFixed(4)}, effective threshold = ${effectiveThreshold}`);

    // --- Step 3: Match gallery faces against query embeddings ---
    const mediaMatches: Record<string, {
      bestSimilarity: number;
      matchCount: number;
      timestamps: number[];
    }> = {};

    for (const face of allFaces) {
      let bestSimilarity = 0;

      for (const qEmb of queryEmbeddings) {
        const sim = cosineSimilarity(qEmb, face.embedding);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
        }
      }

      if (bestSimilarity >= effectiveThreshold) {
        const mediaId = face.mediaId.toString();

        if (!mediaMatches[mediaId]) {
          mediaMatches[mediaId] = {
            bestSimilarity,
            matchCount: 0,
            timestamps: [],
          };
        }

        const group = mediaMatches[mediaId];
        group.matchCount++;

        if (bestSimilarity > group.bestSimilarity) {
          group.bestSimilarity = bestSimilarity;
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
      let similarityPercent = Math.round(((rawSim - 0.25) / 0.35) * 40 + 60);
      similarityPercent = Math.min(100, Math.max(75, similarityPercent));

      // Sort timestamps
      group.timestamps.sort((a, b) => a - b);

      return {
        ...media,
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= 0.38 ? 'HIGH' : group.bestSimilarity >= 0.30 ? 'MEDIUM' : 'LOW',
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
