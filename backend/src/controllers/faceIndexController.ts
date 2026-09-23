import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Media, FaceEmbedding, Event } from '../models';
import { insertFaceEmbedding, isQdrantAvailable } from '../services/qdrantService';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

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

            const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
              headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
              timeout: 60000,
            });

            const faces = aiResponse.data.faces || [];

            // Get image dimensions for metadata
            const sharp = await import('sharp');
            const metadata = await sharp.default(buffer).metadata();
            const width = metadata.width || 0;
            const height = metadata.height || 0;

            // Store embeddings
            for (const face of faces) {
              const faceDoc = await FaceEmbedding.create({
                mediaId: photo._id,
                eventId: photo.eventId,
                studioId: photo.studioId,
                embedding: face.embedding,
                bbox: face.bbox,
                faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
                detectionConfidence: face.det_score || 0,
                faceQuality: face.quality || 0,
                modelVersion: 'buffalo_l_v1',
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

          const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
            timeout: 60000,
          });

          const faces = aiResponse.data.faces || [];

          const sharp = await import('sharp');
          const metadata = await sharp.default(buffer).metadata();

          for (const face of faces) {
            const faceDoc = await FaceEmbedding.create({
              mediaId: photo._id,
              eventId: photo.eventId,
              studioId: photo.studioId,
              embedding: face.embedding,
              bbox: face.bbox,
              faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
              detectionConfidence: face.det_score || 0,
              faceQuality: face.quality || 0,
              modelVersion: 'buffalo_l_v1',
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
