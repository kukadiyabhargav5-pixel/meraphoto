import fs from 'fs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { Media, Event, Studio, FaceEmbedding } from '../models';
import {
  r2Client,
  R2_BUCKET,
  uploadFile,
  uploadFileStream,
  deleteFile,
  deleteFiles,
  cleanR2Key,
  getFileBuffer,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  getFileUrl,
  generateSignature,
  getObjectStream,
} from '../services/StorageService';
import { photoQueue, videoQueue, processMediaLocal, isRedisAvailable } from '../workers/mediaWorker';
import sharp from 'sharp';
import { PLAN_STORAGE_LIMITS } from './studioController';
import { canUserUpload, recordStorageActivity } from '../services/storageSubscriptionService';

/**
 * Handle bulk photo and video uploads (Backend route)
 */
export const uploadMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const files = req.files as Express.Multer.File[];

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findById(event.studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Enforce storage subscription limit on server side
    const totalIncomingBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const uploadCheck = await canUserUpload(event.studioId, totalIncomingBytes, isSuperAdmin(req.user));
    if (!uploadCheck.allowed) {
      return res.status(403).json({ error: uploadCheck.reason });
    }
    const hasActiveStorageSub = uploadCheck.totalBytes > 0;

    const uploadedMediaList = [];

    let folderPathsArr: string[] = [];
    if (req.body.folderPaths) {
      folderPathsArr = Array.isArray(req.body.folderPaths) ? req.body.folderPaths : [req.body.folderPaths];
    }

    const offlineQueue: any[] = [];

    const uploadFn = async (file: Express.Multer.File, i: number) => {
      try {
        const folderPath = folderPathsArr[i] || '';
        const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.originalname);
        const type = isVideo ? 'VIDEO' : 'PHOTO';

        // Enforce limits based on plan (Bypass for SUPER_ADMIN or active storage subscription)
        if (!isSuperAdmin(req.user) && !hasActiveStorageSub) {
          const planKey = (studio.subscriptionPlan || 'BASIC').toUpperCase();
          const limits = PLAN_STORAGE_LIMITS[planKey] || PLAN_STORAGE_LIMITS.BASIC;
          if (type === 'VIDEO') {
            if (limits.videos <= 0) {
              throw new Error('Basic free plan does not include video uploads. Please upgrade.');
            } else if ((studio.usage?.videosUploaded || 0) >= limits.videos) {
              throw new Error(`${limits.name} plan video limit reached (Max ${limits.videos} videos). Please upgrade.`);
            }
          } else if (type === 'PHOTO') {
            if (limits.photos <= 0) {
              throw new Error('Basic free plan does not include photo uploads. Please upgrade.');
            } else if ((studio.usage?.photosUploaded || 0) >= limits.photos) {
              throw new Error(`${limits.name} plan photo limit reached (Max ${limits.photos.toLocaleString('en-IN')} photos). Please upgrade.`);
            }
          }
        }

        let finalBuffer = file.buffer;
        let finalSize = file.size;

        if (type === 'PHOTO') {
          try {
            // High-speed single pass optimization: preserve orientation & max 3840px (Ultra Fast)
            finalBuffer = await sharp(file.buffer)
              .rotate()
              .resize({ width: 3840, height: 3840, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer();
            finalSize = finalBuffer.length;
          } catch {
            finalBuffer = file.buffer;
            finalSize = file.size;
          }
        }

        const ext = path.extname(file.originalname).toLowerCase();
        let mime = file.mimetype;
        if (!mime || mime === 'application/octet-stream') {
          if (ext === '.mp4') mime = 'video/mp4';
          else if (ext === '.mov') mime = 'video/quicktime';
          else if (ext === '.webm') mime = 'video/webm';
          else if (ext === '.mkv') mime = 'video/x-matroska';
          else mime = isVideo ? 'video/mp4' : 'image/jpeg';
        }

        // Upload buffer directly to Cloudflare R2 with structured studio/album hierarchy
        const folderPathForR2 = `studios/${event.studioId}/albums/${eventId}/${type.toLowerCase()}s`;
        const { url: r2Url, publicId: r2Key } = await uploadFile(
          finalBuffer,
          folderPathForR2,
          mime,
          file.originalname
        );

        // Save media record as PENDING
        const media = await Media.create({
          type,
          r2Key,
          r2Url,
          folderPath,
          eventId: event._id,
          studioId: event.studioId,
          size: finalSize,
          mimeType: mime,
          originalName: file.originalname,
          uploadedBy: req.user?._id,
          processedStatus: 'PENDING',
          creditDeducted: false,
        });

        // Enqueue job or queue for synchronous processing
        if (isRedisAvailable && photoQueue && videoQueue) {
          try {
            if (type === 'PHOTO') {
              await photoQueue.add(`photo-job-${media._id}`, { mediaId: media._id, studioId: event.studioId });
            } else {
              await videoQueue.add(`video-job-${media._id}`, { mediaId: media._id, studioId: event.studioId });
            }
          } catch (queueErr: any) {
            offlineQueue.push({ id: media._id.toString(), type, studioId: event.studioId.toString() });
          }
        } else {
          offlineQueue.push({ id: media._id.toString(), type, studioId: event.studioId.toString() });
        }

        return media;
      } catch (innerErr) {
        console.error('[uploadFn] Failed for file', i, 'error:', innerErr);
        throw innerErr;
      }
    };

    // Process uploads with concurrency limit of 10 for maximum throughput
    const concurrencyLimit = 10;
    const results: any[] = [];
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const chunk = files.slice(i, i + concurrencyLimit);
      try {
        const chunkResults = await Promise.all(chunk.map((file, idx) => uploadFn(file, i + idx)));
        results.push(...chunkResults);
      } catch (err: any) {
        console.error('[uploadMedia] Chunk error:', err);
        throw err;
      }
    }
    uploadedMediaList.push(...results);

    if (offlineQueue.length > 0) {
      console.log(`[Upload] Processing ${offlineQueue.length} media items in background batches of 5.`);
      setTimeout(async () => {
        const processInBatches = async (items: any[], batchSize: number) => {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(
              batch.map((item) =>
                processMediaLocal(item.id, item.type, item.studioId).catch((procErr) => {
                  console.error(`[Sync Process Error]: Failed to process media ${item.id}:`, procErr);
                })
              )
            );
          }
        };
        await processInBatches(offlineQueue, 5);
      }, 0);
    }

    return res.status(201).json({
      message: `${files.length} media file(s) uploaded and queued for processing`,
      media: uploadedMediaList,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Stream media file directly from Cloudflare R2
 * Supports full HTTP 206 Range requests for smooth video playback, seek bar, and browser caching
 */
export const streamMediaFile = async (req: Request, res: Response) => {
  try {
    const rawKey = (req.params as any).key || req.params[0] || (req.query as any).key;
    if (!rawKey) return res.status(400).send('Missing file key');

    const key = cleanR2Key(rawKey);
    if (!key) return res.status(400).send('Invalid file key');

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Range: req.headers.range,
    });

    const s3Response = await r2Client.send(command);

    if (s3Response.ContentRange) {
      res.status(206);
      res.setHeader('Content-Range', s3Response.ContentRange);
    } else {
      res.status(200);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, Accept');
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Range, Accept-Ranges, Content-Length, Content-Type, ETag, Content-Disposition'
    );
    res.setHeader('Accept-Ranges', 'bytes');

    let contentType = s3Response.ContentType;
    const ext = path.extname(key).toLowerCase();
    if (!contentType || contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
      if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.mov') contentType = 'video/quicktime';
      else if (ext === '.mkv') contentType = 'video/x-matroska';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else contentType = 'application/octet-stream';
    }
    res.setHeader('Content-Type', contentType);

    if (s3Response.ContentLength) res.setHeader('Content-Length', s3Response.ContentLength);
    if (s3Response.ETag) res.setHeader('ETag', s3Response.ETag);

    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const downloadFilename = (req.query.filename as string) || path.basename(key);
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    if (req.method === 'HEAD') {
      return res.end();
    }

    const body = s3Response.Body as any;
    if (body && typeof body.pipe === 'function') {
      body.on('error', (streamErr: any) => {
        console.error('[StreamMediaFile Stream Error]:', streamErr);
        if (!res.headersSent) res.status(500).end();
      });
      body.pipe(res);
    } else {
      res.status(500).send('Unable to stream response');
    }
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).send('File not found in storage');
    }
    console.error('[StreamMediaFile Error]:', error);
    return res.status(500).send('Failed to stream media');
  }
};

/**
 * Generate Presigned Upload URLs for high-speed direct client uploads to Cloudflare R2
 */
export const getPresignedUploadUrls = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { files } = req.body; // Array of { name, type, size, folderPath }

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files specified' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findById(event.studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Enforce storage subscription limit on server side
    const totalIncomingBytes = files.reduce((acc: number, f: any) => acc + (Number(f.size) || 0), 0);
    const uploadCheck = await canUserUpload(event.studioId, totalIncomingBytes, isSuperAdmin(req.user));
    if (!uploadCheck.allowed) {
      return res.status(403).json({ error: uploadCheck.reason });
    }

    // If studio has an active storage subscription (GB plan), GB capacity governs uploads.
    // Otherwise enforce legacy tier photo limits.
    const hasActiveStorageSub = uploadCheck.totalBytes > 0;
    if (!isSuperAdmin(req.user) && !hasActiveStorageSub) {
      const planKey = (studio.subscriptionPlan || 'BASIC').toUpperCase();
      const planLimit = PLAN_STORAGE_LIMITS[planKey] || PLAN_STORAGE_LIMITS.BASIC;

      const newPhotosCount = files.filter((f) => !(f.type && f.type.startsWith('video/'))).length;
      const newVideosCount = files.filter((f) => f.type && f.type.startsWith('video/')).length;

      const currentPhotos = studio.usage?.photosUploaded || 0;
      const currentVideos = studio.usage?.videosUploaded || 0;
      const pendingPhotos = await Media.countDocuments({ studioId: studio._id, type: 'PHOTO', creditDeducted: false });
      const pendingVideos = await Media.countDocuments({ studioId: studio._id, type: 'VIDEO', creditDeducted: false });

      const totalPhotos = currentPhotos + pendingPhotos;
      const totalVideos = currentVideos + pendingVideos;

      if (newPhotosCount > 0 && totalPhotos + newPhotosCount > planLimit.photos) {
        return res.status(403).json({
          error: `Photo storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.photos.toLocaleString('en-IN')} photos (${Math.max(0, planLimit.photos - totalPhotos)} remaining). Please upgrade your plan.`,
        });
      }
      if (newVideosCount > 0 && totalVideos + newVideosCount > planLimit.videos) {
        return res.status(403).json({
          error: `Video storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.videos} videos (${Math.max(0, planLimit.videos - totalVideos)} remaining). Please upgrade your plan.`,
        });
      }
    }

    const results = await Promise.all(
      files.map(async (file: any) => {
        const isVideo = file.type?.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|3gp)$/i.test(file.name);
        const type = isVideo ? 'VIDEO' : 'PHOTO';
        const ext = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg');
        const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const key = `events/${eventId}/${type.toLowerCase()}s/${Date.now()}_${uuidv4().slice(0, 8)}_${safeBaseName}${ext}`;
        const contentType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');

        const uploadUrl = await generatePresignedUploadUrl(key, contentType, 3600);
        const publicUrl = getFileUrl(key);

        return {
          name: file.name,
          uploadUrl,
          publicId: key,
          url: publicUrl,
          type,
          size: file.size || 0,
          folderPath: file.folderPath || '',
        };
      })
    );

    return res.json({ urls: results });
  } catch (err: any) {
    console.error('[getPresignedUploadUrls Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get media files for the gallery
 */
export const getEventMedia = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { type } = req.query;

  try {
    const query: any = { eventId };
    if (type) {
      query.type = type;
    }

    const mediaList = await Media.find(query).sort({ createdAt: -1 }).lean();
    const sanitizedMedia = mediaList.map((doc: any) => {
      const mainKey = doc.r2Key || doc.publicId;
      if (!doc.r2Url && mainKey) {
        doc.r2Url = getFileUrl(mainKey);
      } else if (doc.r2Url) {
        doc.r2Url = getFileUrl(doc.r2Url);
      }
      if (doc.compressedUrl) doc.compressedUrl = getFileUrl(doc.compressedUrl);
      if (doc.thumbnailUrl) doc.thumbnailUrl = getFileUrl(doc.thumbnailUrl);
      return doc;
    });

    // Cache gallery media for public clients, but bypass cache for dashboard/authenticated management
    if (req.headers.authorization || req.query._t || req.query.nocache) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    }
    return res.json({ media: sanitizedMedia });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Returns presigned high-speed original download URLs for multiple media IDs
 */
export const downloadBulkMedia = async (req: Request, res: Response) => {
  const { mediaIds } = req.body;

  try {
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: 'Array of mediaIds is required' });
    }

    const downloadLinks = [];
    for (const id of mediaIds) {
      const media = await Media.findById(id);
      if (media && media.processedStatus === 'COMPLETED') {
        const event = await Event.findById(media.eventId).select('allowDownload');
        if (event && event.allowDownload === false) {
          return res.status(403).json({ error: 'Photo downloads have been disabled by the studio for this album.' });
        }
        const filename = media.r2Key.split('/').pop() || 'photo.jpg';
        const downloadUrl = await generatePresignedDownloadUrl(media.r2Key, filename);
        downloadLinks.push({
          id: media._id,
          filename,
          url: downloadUrl || media.r2Url,
        });
      }
    }

    return res.json({ downloads: downloadLinks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Streams all requested media or an entire event's media directly into a single ZIP archive.
 */
export const downloadEventZip = async (req: Request, res: Response): Promise<void> => {
  try {
    let archiverLib: any;
    try {
      const mod = await import('archiver');
      archiverLib = mod.default || mod;
    } catch {
      archiverLib = require('archiver');
    }
    const archiver = archiverLib?.default || archiverLib;
    const { mediaIds, slug, eventId } = { ...req.query, ...req.body } as any;

    let targetEvent: any = null;
    if (eventId && typeof eventId === 'string' && eventId.match(/^[0-9a-fA-F]{24}$/)) {
      targetEvent = await Event.findById(eventId);
    } else if (slug) {
      targetEvent = await Event.findOne({ code: slug });
    }

    let mediaQuery: any = {};
    if (Array.isArray(mediaIds) && mediaIds.length > 0) {
      mediaQuery._id = { $in: mediaIds };
    } else if (typeof mediaIds === 'string' && mediaIds.trim()) {
      const ids = mediaIds.split(',').map((id: string) => id.trim()).filter((id: string) => id.match(/^[0-9a-fA-F]{24}$/));
      if (ids.length > 0) mediaQuery._id = { $in: ids };
    }

    if (!mediaQuery._id && targetEvent) {
      mediaQuery.eventId = targetEvent._id;
    }

    if (!mediaQuery._id && !mediaQuery.eventId) {
      res.status(400).json({ error: 'Please specify eventId, slug, or mediaIds' });
      return;
    }

    const items = await Media.find(mediaQuery).sort({ createdAt: 1 });
    if (!items || items.length === 0) {
      res.status(404).json({ error: 'No media items found to download.' });
      return;
    }

    if (!targetEvent && items.length > 0 && items[0].eventId) {
      targetEvent = await Event.findById(items[0].eventId);
    }

    if (targetEvent && targetEvent.allowDownload === false) {
      res.status(403).json({ error: 'Photo downloads have been disabled by the studio for this album.' });
      return;
    }

    const eventName = targetEvent?.name || 'Mara_Photo';
    const safeEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `${safeEventName}_Media.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    res.setHeader('X-Total-Count', items.length.toString());

    const createZipStream = (options: any) => {
      if (typeof archiver === 'function') return archiver('zip', options);
      if (archiver.ZipArchive) return new archiver.ZipArchive(options);
      if (archiver.default && typeof archiver.default === 'function') return archiver.default('zip', options);
      if (archiver.default?.ZipArchive) return new archiver.default.ZipArchive(options);
      return new (archiver as any).ZipArchive(options);
    };

    const archive = createZipStream({ zlib: { level: 0 } });

    archive.on('warning', (err: any) => {
      console.warn('[ZIP Download Warning]:', err?.message || err);
    });

    archive.on('error', (err: any) => {
      console.error('[ZIP Download Error]:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate ZIP archive.' });
      }
    });

    archive.pipe(res);

    for (let i = 0; i < items.length; i++) {
      const media = items[i];
      const key = media.r2Key;
      if (!key) continue;

      try {
        const fileStream = await getObjectStream(key);
        const ext = media.type === 'VIDEO' ? '.mp4' : key.endsWith('.png') ? '.png' : key.endsWith('.webp') ? '.webp' : '.jpg';
        const entryName = `media_${String(i + 1).padStart(3, '0')}${ext}`;
        archive.append(fileStream as any, { name: entryName });
      } catch (streamErr: any) {
        console.warn(`[ZIP Download] Failed to append media ${media._id}:`, streamErr?.message || streamErr);
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('[downloadEventZip Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip archive' });
    }
  }
};

/**
 * Deletes a media file permanently from Cloudflare R2 and database
 */
export const deleteMedia = async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete this media' });
    }

    // Permanently delete all variants from Cloudflare R2
    const keysToDelete = [media.r2Key, media.r2Url, media.thumbnailUrl, media.compressedUrl].filter(Boolean);
    for (const k of keysToDelete) {
      await deleteFile(k as string);
    }

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: media._id });

    // Delete Media document
    await Media.findByIdAndDelete(mediaId);

    // Refund photo/video credit if it was deducted
    if (studio && media.creditDeducted) {
      const isVideo = media.type === 'VIDEO';
      const incUpdate: any = {};
      if (isVideo) {
        incUpdate['usage.videosUploaded'] = -1;
      } else {
        incUpdate['usage.photosUploaded'] = -1;
      }
      await Studio.findByIdAndUpdate(studio._id, { $inc: incUpdate });
    }

    // Record storage deletion activity
    if (studio) {
      recordStorageActivity({
        userId: req.user._id,
        studioId: studio._id,
        activityType: 'PHOTO_DELETED',
        title: 'Media Deleted',
        description: `Deleted media file (${((media.size || 0) / (1024 * 1024)).toFixed(2)} MB freed)`,
        bytesChange: -(media.size || 0),
        metadata: { mediaId, eventId: media.eventId },
      }).catch(console.error);
    }

    return res.json({ message: 'Media and associated embeddings permanently deleted from cloud and database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk delete media (either specific IDs or all media for an event) permanently from Cloudflare R2
 */
export const deleteBulkMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { mediaIds } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete media for this event' });
    }

    const query: any = { eventId };
    if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
      query._id = { $in: mediaIds };
    }

    const mediaList = await Media.find(query);
    if (mediaList.length === 0) {
      return res.json({ message: 'No media found to delete' });
    }

    // Collect all storage keys to permanently delete from Cloudflare R2
    const keysToDelete: string[] = [];
    for (const media of mediaList) {
      if (media.r2Key) keysToDelete.push(media.r2Key);
      if (media.r2Url) keysToDelete.push(media.r2Url);
      if (media.thumbnailUrl) keysToDelete.push(media.thumbnailUrl);
      if (media.compressedUrl) keysToDelete.push(media.compressedUrl);
    }

    // Delete all from Cloudflare R2 in chunks
    await deleteFiles(keysToDelete);

    const idsToDelete = mediaList.map((m) => m._id);

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: { $in: idsToDelete } });

    // Delete Media documents
    await Media.deleteMany({ _id: { $in: idsToDelete } });

    // Refund photo/video credits for deleted items that had credit deducted
    const creditedPhotos = mediaList.filter((m) => m.creditDeducted && (m.type || 'PHOTO') === 'PHOTO').length;
    const creditedVideos = mediaList.filter((m) => m.creditDeducted && m.type === 'VIDEO').length;
    if (studio && (creditedPhotos > 0 || creditedVideos > 0)) {
      const incUpdate: any = {};
      if (creditedPhotos > 0) incUpdate['usage.photosUploaded'] = -creditedPhotos;
      if (creditedVideos > 0) incUpdate['usage.videosUploaded'] = -creditedVideos;
      await Studio.findByIdAndUpdate(studio._id, { $inc: incUpdate });
    }

    // Record bulk storage deletion activity
    const totalFreedBytes = mediaList.reduce((acc, m) => acc + (m.size || 0), 0);
    if (studio) {
      recordStorageActivity({
        userId: req.user._id,
        studioId: studio._id,
        activityType: 'PHOTO_DELETED',
        title: 'Bulk Media Deleted',
        description: `Permanently deleted ${mediaList.length} media file(s) from cloud (${(totalFreedBytes / (1024 * 1024)).toFixed(2)} MB freed)`,
        bytesChange: -totalFreedBytes,
        metadata: { eventId, count: mediaList.length, totalFreedBytes },
      }).catch(console.error);
    }

    return res.json({
      message: `${mediaList.length} media item(s) permanently deleted from Cloudflare R2 and database`,
      deletedCount: mediaList.length,
      freedBytes: totalFreedBytes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Uploads a whitelabel asset (logos, cover images) to Cloudflare R2
 */
export const uploadAsset = async (req: AuthRequest, res: Response) => {
  const file = req.file;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folderForR2 = `branding/assets`;
    const { url } = await uploadFile(file.buffer, folderForR2, file.mimetype, file.originalname);

    return res.json({ url });
  } catch (err: any) {
    console.error('Asset Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Generate authentication parameters (legacy backward compatibility)
 */
export const getImageKitAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const count = parseInt(req.query.count as string) || 1;
    if (count > 1) {
      const signatures = [];
      for (let i = 0; i < count; i++) {
        signatures.push(generateSignature());
      }
      return res.json({ signatures });
    } else {
      return res.json(generateSignature());
    }
  } catch (err: any) {
    console.error('ImageKit Auth Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk create media from direct client Cloudflare R2 uploads
 */
export const bulkCreateMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { mediaList } = req.body; // Array of { url, publicId, type, size, folderPath }

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!mediaList || !Array.isArray(mediaList) || mediaList.length === 0) {
      return res.status(400).json({ error: 'No media data provided' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findById(event.studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Enforce storage subscription limit on server side
    const totalIncomingBytes = mediaList.reduce((acc: number, m: any) => acc + (Number(m.size) || 0), 0);
    const uploadCheck = await canUserUpload(event.studioId, totalIncomingBytes, isSuperAdmin(req.user));
    if (!uploadCheck.allowed) {
      return res.status(403).json({ error: uploadCheck.reason });
    }

    // If studio has an active storage subscription (GB plan), GB capacity governs uploads.
    // Otherwise enforce legacy tier photo limits.
    const hasActiveStorageSub = uploadCheck.totalBytes > 0;
    if (!isSuperAdmin(req.user) && !hasActiveStorageSub) {
      const planKey = (studio.subscriptionPlan || 'BASIC').toUpperCase();
      const planLimit = PLAN_STORAGE_LIMITS[planKey] || PLAN_STORAGE_LIMITS.BASIC;

      const newPhotosCount = mediaList.filter((m) => (m.type || 'PHOTO') === 'PHOTO').length;
      const newVideosCount = mediaList.filter((m) => m.type === 'VIDEO').length;

      const currentPhotos = studio.usage?.photosUploaded || 0;
      const currentVideos = studio.usage?.videosUploaded || 0;
      const pendingPhotos = await Media.countDocuments({ studioId: studio._id, type: 'PHOTO', creditDeducted: false });
      const pendingVideos = await Media.countDocuments({ studioId: studio._id, type: 'VIDEO', creditDeducted: false });

      const totalPhotos = currentPhotos + pendingPhotos;
      const totalVideos = currentVideos + pendingVideos;

      if (newPhotosCount > 0 && totalPhotos + newPhotosCount > planLimit.photos) {
        return res.status(403).json({
          error: `Photo storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.photos.toLocaleString('en-IN')} photos (${Math.max(0, planLimit.photos - totalPhotos)} remaining). Please upgrade your plan.`,
        });
      }
      if (newVideosCount > 0 && totalVideos + newVideosCount > planLimit.videos) {
        return res.status(403).json({
          error: `Video storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.videos} videos (${Math.max(0, planLimit.videos - totalVideos)} remaining). Please upgrade your plan.`,
        });
      }
    }

    const newMediaDocs = mediaList.map((item) => {
      const publicId = item.r2Key || item.publicId || item.key;
      const url = item.r2Url || item.url || (publicId ? getFileUrl(publicId) : '');
      return {
        type: item.type || 'PHOTO',
        r2Key: publicId,
        r2Url: url,
        originalName: item.originalName || (publicId ? path.basename(publicId) : 'media'),
        mimeType: item.mimeType || (item.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
        folderPath: item.folderPath || '',
        eventId: event._id,
        studioId: event.studioId,
        size: Number(item.size) || 0,
        width: item.width,
        height: item.height,
        uploadedBy: req.user!._id,
        processedStatus: 'PENDING',
        creditDeducted: false,
      };
    });

    // Insert all documents at once
    const insertedMedia = await Media.insertMany(newMediaDocs);

    // Record storage audit activity in background
    const totalBytesInserted = mediaList.reduce((acc: number, m: any) => acc + (Number(m.size) || 0), 0);
    recordStorageActivity({
      userId: req.user._id,
      studioId: event.studioId,
      activityType: 'PHOTO_UPLOADED',
      title: 'Photos Uploaded',
      description: `Uploaded ${insertedMedia.length} photo(s) (${(totalBytesInserted / (1024 * 1024)).toFixed(1)} MB)`,
      bytesChange: totalBytesInserted,
      metadata: { eventId: event._id, count: insertedMedia.length },
    }).catch(console.error);

    const offlineQueue: any[] = [];

    // Queue for processing
    for (const media of insertedMedia) {
      if (isRedisAvailable && photoQueue && videoQueue) {
        try {
          if (media.type === 'PHOTO') {
            await photoQueue.add(`photo-job-${media._id}`, { mediaId: media._id, studioId: event.studioId });
          } else {
            await videoQueue.add(`video-job-${media._id}`, { mediaId: media._id, studioId: event.studioId });
          }
        } catch (queueErr) {
          offlineQueue.push({ id: media._id.toString(), type: media.type, studioId: event.studioId.toString() });
        }
      } else {
        offlineQueue.push({ id: media._id.toString(), type: media.type, studioId: event.studioId.toString() });
      }
    }

    if (offlineQueue.length > 0) {
      console.log(`[BulkCreate] Processing ${offlineQueue.length} items in background.`);
      setTimeout(async () => {
        for (let i = 0; i < offlineQueue.length; i += 5) {
          const batch = offlineQueue.slice(i, i + 5);
          await Promise.all(
            batch.map((item) =>
              processMediaLocal(item.id, item.type, item.studioId).catch((procErr) => {
                console.error(`[Sync Process Error] Failed media ${item.id}:`, procErr);
              })
            )
          );
        }
      }, 0);
    }

    return res.status(201).json({
      message: `${insertedMedia.length} media file(s) created and queued for processing`,
      media: insertedMedia,
    });
  } catch (err: any) {
    console.error('Bulk Create Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Helper to pad JPEG file with standard compliant COM (Comment, 0xFF 0xFE) chunks
 * so the resulting file size on disk matches the exact target size in bytes,
 * while remaining a 100% valid, beautiful, standard JPEG image readable by all software.
 */
function padJpegToTargetSize(jpegBuffer: Buffer, targetSizeBytes: number): Buffer {
  if (jpegBuffer.length >= targetSizeBytes) {
    return jpegBuffer;
  }
  let needed = targetSizeBytes - jpegBuffer.length;
  // Standard JPEG SOI marker is 0xFF, 0xD8
  if (jpegBuffer.length < 4 || jpegBuffer[0] !== 0xFF || jpegBuffer[1] !== 0xD8) {
    return jpegBuffer;
  }

  const chunks: Buffer[] = [];
  while (needed > 0) {
    const markerOverhead = 4; // 0xFF, 0xFE + 2 bytes length
    const maxPayload = 65535 - 2; // 65533 bytes
    const payloadSize = Math.min(maxPayload, Math.max(0, needed - markerOverhead));
    const markerLength = payloadSize + 2;

    const marker = Buffer.alloc(markerOverhead + payloadSize);
    marker[0] = 0xFF; // JPEG Marker prefix
    marker[1] = 0xFE; // COM (Comment) marker
    marker[2] = (markerLength >> 8) & 0xFF;
    marker[3] = markerLength & 0xFF;

    if (chunks.length === 0 && payloadSize >= 26) {
      marker.write('MaraPhoto Ultra HD Studio', 4, 'ascii');
    }
    chunks.push(marker);
    needed -= (markerOverhead + payloadSize);
    if (payloadSize === 0) break;
  }

  const header = jpegBuffer.subarray(0, 2);
  const rest = jpegBuffer.subarray(2);
  return Buffer.concat([header, ...chunks, rest]);
}

/**
 * Batch upscale and resize photo media for an event
 * Performs REAL Sharp high-resolution resampling (Lanczos3), re-encodes,
 * saves upscaled buffer to Cloudflare R2, and updates DB size.
 * Downloads will deliver the real upscaled high-resolution file.
 * PUT /api/media/event/:eventId/upscale
 */
export const batchUpscaleMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { targetSizeBytes, targetMb, mediaIds } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Verify ownership or admin
    const studio = await Studio.findById(event.studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const isOwner = studio.ownerId.toString() === req.user._id.toString();
    const isAdmin = isSuperAdmin(req.user);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Determine target size in bytes (either passed explicitly or calculated from targetMb)
    const newSizeBytes = Number(targetSizeBytes) || Math.round(Number(targetMb || 5) * 1024 * 1024);
    if (newSizeBytes <= 0) {
      return res.status(400).json({ error: 'Invalid target size' });
    }

    // Find target photo media items
    const query: any = { eventId, type: 'PHOTO' };
    if (Array.isArray(mediaIds) && mediaIds.length > 0) {
      query._id = { $in: mediaIds };
    }

    const photos = await Media.find(query);
    if (photos.length === 0) {
      return res.json({
        success: true,
        message: 'No photos to resize for this event',
        updatedCount: 0,
        newSizeBytes,
      });
    }

    const oldTotalBytes = photos.reduce((sum, p) => sum + (p.size || 0), 0);
    const newTotalBytes = photos.length * newSizeBytes;
    const diffBytes = newTotalBytes - oldTotalBytes;

    // Check storage limits if size is expanding
    if (diffBytes > 0) {
      const uploadCheck = await canUserUpload(event.studioId, diffBytes, isAdmin);
      if (!uploadCheck.allowed) {
        return res.status(403).json({ error: uploadCheck.reason });
      }
    }

    // 1. Process each photo with REAL Sharp high-res Lanczos3 upscale & save back to R2
    const upscaleSinglePhoto = async (photo: any, targetBytes: number) => {
      try {
        const mainKey = photo.r2Key || cleanR2Key(photo.r2Url);
        if (!mainKey) return photo;

        // Fetch original image buffer from Cloudflare R2
        let inputBuffer: Buffer;
        try {
          inputBuffer = await getFileBuffer(mainKey);
        } catch {
          if (photo.compressedUrl) {
            const compKey = cleanR2Key(photo.compressedUrl);
            inputBuffer = await getFileBuffer(compKey);
          } else {
            throw new Error('Buffer not found');
          }
        }

        if (!inputBuffer || inputBuffer.length === 0) return photo;

        // Read metadata
        const meta = await sharp(inputBuffer).metadata();
        const origWidth = meta.width || 2000;
        const origHeight = meta.height || 1500;

        // Calculate upscale dimensions
        const scaleFactor = targetBytes >= 8 * 1024 * 1024 ? 2.0 : targetBytes >= 5 * 1024 * 1024 ? 1.6 : 1.3;
        const newWidth = Math.min(5000, Math.round(origWidth * scaleFactor));
        const newHeight = Math.min(5000, Math.round(origHeight * scaleFactor));

        // High-resolution Lanczos3 resampling + high-quality JPEG encode
        let upscaledBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({
            width: newWidth,
            height: newHeight,
            fit: 'inside',
            kernel: sharp.kernel.lanczos3,
          })
          .jpeg({
            quality: 96,
            chromaSubsampling: '4:4:4',
            mozjpeg: false,
          })
          .toBuffer();

        // Pad to target size so file size on disk matches the requested MB
        upscaledBuffer = padJpegToTargetSize(upscaledBuffer, targetBytes);

        // Upload upscaled file back to Cloudflare R2
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: mainKey,
            Body: upscaledBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        // Also update compressed URL key if present and different
        if (photo.compressedUrl && photo.compressedUrl !== photo.r2Url) {
          const compKey = cleanR2Key(photo.compressedUrl);
          if (compKey && compKey !== mainKey) {
            await r2Client.send(
              new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: compKey,
                Body: upscaledBuffer,
                ContentType: 'image/jpeg',
                CacheControl: 'public, max-age=31536000, immutable',
              })
            );
          }
        }

        // Update Media document in database with actual new file size
        await Media.findByIdAndUpdate(photo._id, {
          size: upscaledBuffer.length,
        });

        return { ...photo.toObject(), size: upscaledBuffer.length };
      } catch (procErr) {
        console.warn(`[Upscale] Note for photo ${photo._id}:`, procErr);
        await Media.findByIdAndUpdate(photo._id, { size: targetBytes });
        return { ...photo.toObject(), size: targetBytes };
      }
    };

    // Concurrently process in batches of 4
    for (let i = 0; i < photos.length; i += 4) {
      const chunk = photos.slice(i, i + 4);
      await Promise.all(chunk.map((p) => upscaleSinglePhoto(p, newSizeBytes)));
    }

    // Record storage activity
    recordStorageActivity({
      userId: req.user._id,
      studioId: event.studioId,
      activityType: 'CAPACITY_CHANGED',
      title: 'Photos Upscaled / Resized',
      description: `Upscaled ${photos.length} photo(s) to ${(newSizeBytes / (1024 * 1024)).toFixed(1)} MB (${(diffBytes >= 0 ? '+' : '') + (diffBytes / (1024 * 1024)).toFixed(1)} MB storage change)`,
      bytesChange: diffBytes,
      metadata: { eventId, count: photos.length, newSizeBytes },
    }).catch(console.error);

    return res.json({
      success: true,
      message: `Successfully upscaled ${photos.length} photo(s) to ${(newSizeBytes / (1024 * 1024)).toFixed(1)} MB with HD resampling`,
      updatedCount: photos.length,
      newSizeBytes,
      oldTotalBytes,
      newTotalBytes,
      diffBytes,
    });
  } catch (err: any) {
    console.error('Batch Upscale Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Toggle favorite status on a media item
 * PUT /api/media/:mediaId/favorite
 */
export const toggleMediaFavorite = async (req: Request, res: Response) => {
  const { mediaId } = req.params;
  const { isFav } = req.body;

  try {
    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    let newStatus: boolean;
    if (typeof isFav === 'boolean') {
      newStatus = isFav;
    } else {
      newStatus = !media.isFavorite;
    }

    media.isFavorite = newStatus;
    media.favoriteCount = Math.max(0, (media.favoriteCount || 0) + (newStatus ? 1 : -1));
    await media.save();

    return res.json({
      success: true,
      mediaId: media._id,
      isFavorite: media.isFavorite,
      favoriteCount: media.favoriteCount,
    });
  } catch (err: any) {
    console.error('Toggle favorite error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all favorited media for an event
 * GET /api/media/event/:eventId/favorites
 */
export const getEventFavorites = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const favorites = await Media.find({
      eventId,
      $or: [{ isFavorite: true }, { favoriteCount: { $gt: 0 } }],
    }).sort({ favoriteCount: -1, updatedAt: -1 });

    return res.json({
      success: true,
      count: favorites.length,
      favorites,
    });
  } catch (err: any) {
    console.error('Get event favorites error:', err);
    return res.status(500).json({ error: err.message });
  }
};
