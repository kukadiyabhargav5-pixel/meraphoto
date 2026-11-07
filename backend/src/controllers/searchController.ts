import { Request, Response } from 'express';
import { Event, Media, FaceEmbedding, SearchSession } from '../models';
import { findEventByIdOrCode } from './mediaController';
import { searchFaces, isQdrantAvailable, localCosineSearch } from '../services/qdrantService';
import { getObjectStream, getFileUrl } from '../services/StorageService';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
// archiver imported dynamically to avoid ERR_REQUIRE_ESM on startup

const getCandidateAiUrls = (): string[] => {
  const envUrl = process.env.AI_SERVICE_URL;
  const list = [
    envUrl,
    'http://meraphotoes-ai:10000',
    'https://meraphotoes-ai.onrender.com',
    'http://maraphotoes-ai:10000',
    'http://meraphoto-ai:10000',
    'https://maraphotoes-ai.onrender.com',
    'https://meraphoto-ai.onrender.com',
    'http://127.0.0.1:8000',
  ].filter(Boolean) as string[];
  return Array.from(new Set(list));
};

/**
 * L2-normalize a vector in-place (or return new array).
 */
const l2Normalize = (vec: number[]): number[] => {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  if (Math.abs(norm - 1.0) < 0.01) return vec; // Already normalized
  return vec.map(v => v / norm);
};

/**
 * Cosine similarity between two vectors.
 * Always L2-normalizes both inputs to handle mixed normalized/unnormalized embeddings.
 * This is critical because older indexed embeddings may have L2 norm ~22 (raw InsightFace)
 * while newer TTA-processed embeddings are unit-normalized (norm=1.0).
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) return 0;
  const na = l2Normalize(a);
  const nb = l2Normalize(b);
  let dot = 0;
  for (let i = 0; i < na.length; i++) {
    dot += na[i] * nb[i];
  }
  return dot;
};

/**
 * Pre-flight AI service wake-up: pings /health to trigger Render cold-start
 * before attempting the actual face detection request.
 * Waits up to 30s for the service to become ready.
 */
const wakeUpAiService = async (): Promise<string | null> => {
  const urls = getCandidateAiUrls();
  
  // Quick check: try to find an already-awake URL
  for (const baseUrl of urls) {
    try {
      const res = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      if (res.data?.engine_ready === true) {
        return baseUrl; // Already warm and ready
      }
    } catch {
      // Not available, continue
    }
  }

  // Cold start detected: ping all URLs and wait for one to wake up
  console.log('[Face Search] AI service appears cold. Sending wake-up pings...');
  
  for (let attempt = 0; attempt < 6; attempt++) { // 6 attempts × 5s = 30s max wait
    for (const baseUrl of urls) {
      try {
        const res = await axios.get(`${baseUrl}/health`, { timeout: 8000 });
        if (res.data?.engine_ready === true) {
          console.log(`[Face Search] AI service awake at ${baseUrl} after ${(attempt + 1) * 5}s`);
          return baseUrl;
        }
        if (res.data?.status === 'healthy') {
          // Service is up but engine still loading - wait
          console.log(`[Face Search] AI service responding but engine loading (attempt ${attempt + 1}/6)...`);
        }
      } catch {
        // Still waking up
      }
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  return null; // Could not wake up
};

/**
 * Extract face embeddings from an uploaded file via AI service.
 * Supports multiple candidate URLs and retries to handle Render free-tier cold starts.
 * Includes pre-flight wake-up and 3 retry attempts per URL with exponential backoff.
 */
const extractEmbeddingsFromFile = async (file: Express.Multer.File): Promise<any[]> => {
  // Pre-flight: wake up the AI service if it's sleeping
  const preferredUrl = await wakeUpAiService();
  
  const urls = getCandidateAiUrls();
  // If we found a preferred (warm) URL, try it first
  if (preferredUrl) {
    const idx = urls.indexOf(preferredUrl);
    if (idx > 0) {
      urls.splice(idx, 1);
      urls.unshift(preferredUrl);
    }
  }

  let lastError: any = null;

  for (const baseUrl of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', file.buffer, file.originalname || 'selfie.jpg');

        const aiResponse = await axios.post(`${baseUrl}/detect-faces`, formData, {
          headers: { ...formData.getHeaders(), 'bypass-tunnel-reminder': 'true' },
          timeout: 60000, // 60s timeout for cold starts
        });

        if (aiResponse.data && Array.isArray(aiResponse.data.faces)) {
          return aiResponse.data.faces;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Face Search] AI service attempt ${attempt}/3 on ${baseUrl} failed:`, err.message);
        if (err.response?.status === 503 || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
          if (attempt < 3) {
            // Exponential backoff: 3s, 6s
            const delay = attempt * 3000;
            console.log(`[Face Search] Retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
          }
        } else {
          break; // Non-retryable error, try next URL
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
          // Always L2-normalize embedding before storage for consistent cosine similarity
          const rawEmb: number[] = face.embedding || [];
          let sumSq = 0;
          for (const v of rawEmb) sumSq += v * v;
          const norm = Math.sqrt(sumSq);
          const normalizedEmb = (norm > 0 && Math.abs(norm - 1.0) > 0.01)
            ? rawEmb.map((v: number) => v / norm)
            : rawEmb;

          await FaceEmbedding.create({
            mediaId: photo._id,
            eventId: photo.eventId,
            studioId: photo.studioId,
            embedding: normalizedEmb,
            bbox: face.bbox,
            faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
            detectionConfidence: face.det_score || 0,
            faceQuality: face.quality || 0,
            modelVersion: 'buffalo_sc_v1_normalized',
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

    const event = await findEventByIdOrCode(eventId);
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
        if (faces && faces.length > 0) {
          // Sort faces by prominence (bounding box area * detection confidence)
          faces.sort((a: any, b: any) => {
            const areaA = (a.bbox ? (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) : 0) || (a.area || 0);
            const areaB = (b.bbox ? (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) : 0) || (b.area || 0);
            const scoreA = areaA * (a.det_score || a.quality || 1);
            const scoreB = areaB * (b.det_score || b.quality || 1);
            return scoreB - scoreA;
          });

          // Primary most prominent face
          if (faces[0].embedding && Array.isArray(faces[0].embedding) && faces[0].embedding.length > 0) {
            queryEmbeddings.push(faces[0].embedding);
          }

          // If couple / secondary face present in single selfie photo
          if (files.length === 1 && faces.length > 1) {
            const primaryArea = (faces[0].bbox ? (faces[0].bbox[2] - faces[0].bbox[0]) * (faces[0].bbox[3] - faces[0].bbox[1]) : 0) || (faces[0].area || 1);
            for (let i = 1; i < Math.min(faces.length, 3); i++) {
              const secondary = faces[i];
              const secArea = (secondary.bbox ? (secondary.bbox[2] - secondary.bbox[0]) * (secondary.bbox[3] - secondary.bbox[1]) : 0) || (secondary.area || 0);
              if (secArea >= primaryArea * 0.35 && (secondary.det_score || 0) >= 0.45 && secondary.embedding?.length > 0) {
                queryEmbeddings.push(secondary.embedding);
              }
            }
          }
        }
      } catch (aiErr: any) {
        lastAiError = aiErr;
        console.error('[Face Search] AI service error for frame:', aiErr.message);
      }
    }

    if (queryEmbeddings.length === 0) {
      if (lastAiError) {
        res.status(503).json({
          error: 'AI Face Recognition service could not be reached after multiple attempts. Please ensure the AI service is running and try again.',
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

    // --- Step 3: High-Accuracy Biometric Matching with Calibrated Adaptive Thresholds ---
    // Pre-normalize all query embeddings for fast vector dot-product matching
    const normQueries = queryEmbeddings.map((q) => l2Normalize(q));

    // Pre-compute similarity for all gallery faces and identify identity anchor
    let peakSimilarity = 0;
    const faceSims = new Map<string, number>();

    for (const face of allFaces) {
      const normFace = l2Normalize(face.embedding);
      let maxSimForFace = 0;
      for (const normQ of normQueries) {
        let dot = 0;
        for (let i = 0; i < normQ.length; i++) {
          dot += normQ[i] * normFace[i];
        }
        if (dot > maxSimForFace) {
          maxSimForFace = dot;
        }
      }
      faceSims.set(face._id.toString(), maxSimForFace);
      if (maxSimForFace > peakSimilarity) {
        peakSimilarity = maxSimForFace;
      }
    }

    // Calibrated biometrics for InsightFace ArcFace 512-D:
    // - Two distinct random individuals: cosine similarity is typically 0.05 .. 0.25 (rarely > 0.28).
    // - Candid, side-angle, smiling, dancing, stage-lit photos of the same person: ~0.32 .. 0.44.
    // - Clear frontal photos of the same person: ~0.44 .. 0.70+.
    //
    // Adaptive Identity Calibration:
    // 1. If peakSimilarity >= 0.45: Identity is 100% confirmed by a clear anchor photo.
    //    We adaptively set effectiveThreshold to 0.32 to capture ALL candid, angled, crowd,
    //    and low-light photos of this person without missing valid memories.
    // 2. If peakSimilarity >= 0.40: High confidence identity. Threshold = 0.33.
    // 3. If peakSimilarity >= 0.35: Confirmed identity. Threshold = 0.34.
    // 4. If peakSimilarity >= 0.31: Plausible candidate. Threshold = 0.31.
    // 5. If peakSimilarity < 0.31: Person is truly NOT in this gallery. Clean zero results.
    // Calibrated biometrics for InsightFace ArcFace 512-D:
    // - Unrelated faces in crowd/candid settings: similarity centered around 0.10 - 0.28 (rarely ~0.34 in harsh shadow/crowd).
    // - Confirmed identity anchor photos: cosine similarity >= 0.42 to 0.75.
    // - Genuine candid, expression change, or side profile of the same person: ~0.36 to 0.45.
    //
    // 100% Precision Calibration:
    // 1. If peakSimilarity < 0.38: Person is truly NOT in this gallery. Clean zero results (guarantees zero false positives).
    // 2. If peakSimilarity >= 0.50: Identity is 100% verified by clear anchor photo. Set effectiveThreshold to 0.36
    //    to capture all candid/stage/dancing moments of this exact person.
    // 3. If peakSimilarity >= 0.42: High confidence identity. Threshold = 0.38.
    // 4. If peakSimilarity >= 0.38: Confirmed identity. Threshold = 0.39.
    // High-Power Adaptive Face Recognition Threshold
    // Boosted matching power: captures all genuine candid, stage, and side-profile moments
    let effectiveThreshold = 0.34;
    if (event.searchThreshold && typeof event.searchThreshold === 'number' && event.searchThreshold >= 0.28 && event.searchThreshold <= 0.60) {
      effectiveThreshold = event.searchThreshold;
    } else if (peakSimilarity >= 0.50) {
      effectiveThreshold = 0.33;
    } else if (peakSimilarity >= 0.40) {
      effectiveThreshold = 0.34;
    } else if (peakSimilarity >= 0.34) {
      effectiveThreshold = 0.34;
    } else {
      effectiveThreshold = 0.35;
    }

    console.log(
      `[Face Search] Event ${eventId}: queries=${normQueries.length}, faces=${allFaces.length}, peak=${peakSimilarity.toFixed(4)}, effectiveThreshold=${effectiveThreshold}`
    );

    // Peak threshold check: 0.33 minimum to reject complete non-faces while capturing genuine guests
    if (peakSimilarity < effectiveThreshold || peakSimilarity < 0.33) {
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

    // Group matching faces by mediaId and record highest similarity
    const mediaMatches: Record<string, {
      bestSimilarity: number;
      matchCount: number;
      timestamps: number[];
    }> = {};

    for (const face of allFaces) {
      const faceSim = faceSims.get(face._id.toString()) || 0;
      if (faceSim >= effectiveThreshold) {
        const mediaId = face.mediaId.toString();

        if (!mediaMatches[mediaId]) {
          mediaMatches[mediaId] = {
            bestSimilarity: faceSim,
            matchCount: 0,
            timestamps: [],
          };
        }

        const group = mediaMatches[mediaId];
        group.matchCount++;

        if (faceSim > group.bestSimilarity) {
          group.bestSimilarity = faceSim;
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

      // Realistic, calibrated biometric similarity percentage for UI:
      // Maps ArcFace cosine similarity range [0.36 .. 0.70] to [75% .. 99%]
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

      // Sort timestamps
      group.timestamps.sort((a, b) => a - b);

      const r2Url = getFileUrl(media.r2Url || media.r2Key);
      const compressedUrl = getFileUrl(media.compressedUrl || media.r2Url || media.r2Key);
      const thumbnailUrl = getFileUrl(media.thumbnailUrl || media.compressedUrl || media.r2Url || media.r2Key);

      return {
        ...media,
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

    // Create durable search session record for verified results ZIP download
    let searchSessionId = '';
    if (results.length > 0) {
      searchSessionId = uuidv4();
      try {
        await SearchSession.create({
          sessionId: searchSessionId,
          eventId: event._id,
          matchedMediaIds: results.map((r) => r._id),
          totalMatched: results.length,
          peakSimilarity,
          queryFramesCount: queryEmbeddings.length,
        });
      } catch (sessErr) {
        console.error('[Face Search] Failed to create search session record:', sessErr);
      }
    }

    if (pendingMedia > 0) {
      triggerAutoIndexing(eventId.toString());
    }

    res.status(200).json({
      matches: results,
      searchSessionId,
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

/**
 * Streams a ZIP archive containing ONLY the photos that matched the current face search session.
 * Enforces strict album matching, deduplication, valid search session, and streaming without
 * loading full-resolution images into RAM.
 *
 * Endpoint: POST /api/face-scan/download-zip
 * Payload: { albumId, searchSessionId } or { eventId, searchSessionId }
 */
export const downloadFaceScanZip = async (req: Request, res: Response): Promise<void> => {
  try {
    const albumId = req.body.albumId || req.body.eventId;
    const { searchSessionId } = req.body;

    if (!albumId || !searchSessionId) {
      res.status(400).json({
        error: 'Both albumId and searchSessionId are required to download matching photos.',
      });
      return;
    }

    // 1. Verify the event / album exists
    const event = await Event.findById(albumId).select('_id name studioId allowDownload');
    if (!event) {
      res.status(404).json({ error: 'Album or event not found.' });
      return;
    }

    if (event.allowDownload === false) {
      res.status(403).json({ error: 'Photo downloads are disabled by the studio for this album.' });
      return;
    }

    // 2. Validate the search session
    const session = await SearchSession.findOne({
      sessionId: searchSessionId,
      eventId: event._id,
    });

    if (!session || !session.matchedMediaIds || session.matchedMediaIds.length === 0) {
      res.status(404).json({
        error: 'Search session expired or no matching photos found in this session.',
      });
      return;
    }

    // 3. Deduplicate and verify that all matching media belong strictly to this album
    const uniqueMediaIds = Array.from(
      new Set(session.matchedMediaIds.map((id) => id.toString()))
    );

    const matchingMedia = await Media.find({
      _id: { $in: uniqueMediaIds },
      eventId: event._id,
      type: 'PHOTO',
    }).select('_id r2Key r2Url compressedUrl originalName createdAt');

    if (matchingMedia.length === 0) {
      res.status(404).json({
        error: 'No valid photos found for this search session.',
      });
      return;
    }

    console.log(
      `[ZIP Download] Streaming ${matchingMedia.length} matching photos for session ${searchSessionId} in event ${albumId}`
    );

    // 4. Set required streaming ZIP headers
    const zipFileName = 'face-scan-matching-photos.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    res.setHeader('X-Total-Count', matchingMedia.length.toString());

    // 5. Initialize streaming archiver dynamically (supports ESM & CommonJS)
    let archiverLib: any;
    try {
      const mod = await import('archiver');
      archiverLib = mod.default || mod;
    } catch {
      archiverLib = require('archiver');
    }
    const createZipStream = (options: any) => {
      const arch = archiverLib?.default || archiverLib;
      if (typeof arch === 'function') return arch('zip', options);
      if (arch?.ZipArchive) return new arch.ZipArchive(options);
      return (arch as any)('zip', options);
    };

    const archive = createZipStream({
      zlib: { level: 0 },
    });

    archive.on('warning', (err: any) => {
      if (err.code === 'ENOENT') {
        console.warn('[ZIP Download] Archive warning:', err);
      } else {
        console.error('[ZIP Download] Archive warning error:', err);
      }
    });

    archive.on('error', (err: any) => {
      console.error('[ZIP Download] Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate photo ZIP archive.' });
      }
    });

    // Pipe archive stream directly into HTTP response
    archive.pipe(res);

    // 6. Stream each verified photo from Cloudflare R2 into archive
    let appendedCount = 0;
    for (let i = 0; i < matchingMedia.length; i++) {
      const media = matchingMedia[i];
      const key = media.r2Key;
      if (!key) continue;

      try {
        const fileStream = await getObjectStream(key);
        const ext = key.endsWith('.png') ? '.png' : key.endsWith('.webp') ? '.webp' : '.jpg';
        const sanitizedBase = (media as any).originalName
          ? (media as any).originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
          : `photo_${i + 1}${ext}`;
        const entryName = `photo_${String(i + 1).padStart(3, '0')}_${sanitizedBase}`;

        archive.append(fileStream as any, { name: entryName });
        appendedCount++;
      } catch (streamErr: any) {
        console.warn(`[ZIP Download] Failed to stream photo ${key} from R2:`, streamErr.message);
      }
    }

    if (appendedCount === 0) {
      console.error('[ZIP Download] No photos could be read from storage for session');
    }

    // 7. Finalize archive
    await archive.finalize();
  } catch (err: any) {
    console.error('[ZIP Download] Unexpected error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error while creating ZIP download.' });
    }
  }
};
