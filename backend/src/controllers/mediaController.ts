import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { Media, Event, Studio, FaceEmbedding } from '../models';
import { uploadFile, deleteFile, generateSignature } from '../services/StorageService';
import { photoQueue, videoQueue, processMediaLocal, isRedisAvailable } from '../workers/mediaWorker';
import sharp from 'sharp';

/**
 * Handle bulk photo and video uploads
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

    const uploadedMediaList = [];

    let folderPathsArr: string[] = [];
    if (req.body.folderPaths) {
      folderPathsArr = Array.isArray(req.body.folderPaths) ? req.body.folderPaths : [req.body.folderPaths];
    }

    const offlineQueue: any[] = [];

    const uploadFn = async (file: Express.Multer.File, i: number) => {
      try {
        const folderPath = folderPathsArr[i] || '';
        const isVideo = file.mimetype.startsWith('video/');
        const type = isVideo ? 'VIDEO' : 'PHOTO';
        
        // Enforce limits based on plan (Bypass for SUPER_ADMIN)
        if (!isSuperAdmin(req.user)) {
          if (type === 'VIDEO') {
            if (studio.subscriptionPlan === 'BASIC' && (studio.usage.videosUploaded || 0) >= 10) {
              throw new Error('Basic plan video limit reached (Max 10 videos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'STANDARD' && (studio.usage.videosUploaded || 0) >= 100) {
              throw new Error('Standard plan video limit reached (Max 100 videos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'ESSENTIAL' && (studio.usage.videosUploaded || 0) >= 200) {
              throw new Error('Essential plan video limit reached (Max 200 videos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'PREMIUM' && (studio.usage.videosUploaded || 0) >= 500) {
              throw new Error('Premium plan video limit reached (Max 500 videos). Please upgrade.');
            }
          } else if (type === 'PHOTO') {
            if (studio.subscriptionPlan === 'BASIC' && (studio.usage.photosUploaded || 0) >= 50000) {
              throw new Error('Basic plan photo limit reached (Max 50,000 photos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'STANDARD' && (studio.usage.photosUploaded || 0) >= 150000) {
              throw new Error('Standard plan photo limit reached (Max 150,000 photos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'ESSENTIAL' && (studio.usage.photosUploaded || 0) >= 300000) {
              throw new Error('Essential plan photo limit reached (Max 300,000 photos). Please upgrade.');
            } else if (studio.subscriptionPlan === 'PREMIUM' && (studio.usage.photosUploaded || 0) >= 750000) {
              throw new Error('Premium plan photo limit reached (Max 750,000 photos). Please upgrade.');
            }
          }
        }

        // Compress large images before uploading to stay under Cloudinary 10MB free tier limit
        let finalBuffer = file.buffer;
        let finalSize = file.size;

        if (type === 'PHOTO') {
          // Strict Maximum 2MB compression for photos
          const TWO_MB = 2 * 1024 * 1024;
          finalBuffer = await sharp(file.buffer)
            .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, mozjpeg: true })
            .withMetadata() // Preserve EXIF data (orientation, etc)
            .toBuffer();

          if (finalBuffer.length > TWO_MB) {
            finalBuffer = await sharp(file.buffer)
              .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 75, mozjpeg: true })
              .toBuffer();
          }
          if (finalBuffer.length > TWO_MB) {
            finalBuffer = await sharp(file.buffer)
              .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 65, mozjpeg: true })
              .toBuffer();
          }
          finalSize = finalBuffer.length;
        }

        // Upload optimized file buffer to Cloudinary
        const folderPathForCloudinary = `events/${eventId}/${type.toLowerCase()}s`;
        const { url: r2Url, publicId: r2Key } = await uploadFile(finalBuffer, folderPathForCloudinary);

        // Save media record as PENDING
        const media = await Media.create({
          type,
          r2Key,
          r2Url,
          folderPath,
          eventId: event._id,
          studioId: event.studioId,
          size: finalSize,
          uploadedBy: req.user?._id,
          processedStatus: 'PENDING',
          creditDeducted: false, // Deducted upon saving event
        });

        // Enqueue job or process synchronously
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
          // Redis offline – add to batch queue
          offlineQueue.push({ id: media._id.toString(), type, studioId: event.studioId.toString() });
        }

        return media;
      } catch (innerErr) {
        console.error('[uploadFn] Failed for file', i, 'error:', innerErr);
        throw innerErr;
      }
    };

    // Process uploads with concurrency limit to avoid overwhelming Cloudinary / hitting timeouts
    const concurrencyLimit = 8;
    const results: any[] = [];
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const chunk = files.slice(i, i + concurrencyLimit);
      try {
        const chunkResults = await Promise.all(chunk.map((file, idx) => uploadFn(file, i + idx)));
        results.push(...chunkResults);
      } catch (err: any) {
        console.error('[uploadMedia] Chunk error:', err);
        if (err?.message?.includes('Starter plan')) {
          return res.status(403).json({ error: err.message });
        }
        throw err;
      }
    }
    uploadedMediaList.push(...results);

    if (offlineQueue.length > 0) {
      console.log(`[Upload] Redis offline. Processing ${offlineQueue.length} media items in background batches of 5.`);
      setTimeout(async () => {
        const processInBatches = async (items: any[], batchSize: number) => {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(batch.map(item => processMediaLocal(item.id, item.type, item.studioId).catch(procErr => {
              console.error(`[Sync Process Error]: Failed to process media ${item.id}:`, procErr);
            })));
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
 * Get media files for the gallery (all statuses so users can see uploads in progress)
 */
export const getEventMedia = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { type } = req.query; // 'PHOTO' or 'VIDEO' optional filter

  try {
    const query: any = { eventId };
    if (type) {
      query.type = type;
    }

    const mediaList = await Media.find(query).sort({ createdAt: -1 });
    return res.json({ media: mediaList });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Returns presigned original download URLs for multiple media IDs
 */
export const downloadBulkMedia = async (req: Request, res: Response) => {
  const { mediaIds } = req.body; // array of mediaIds

  try {
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: 'Array of mediaIds is required' });
    }

    const downloadLinks = [];
    for (const id of mediaIds) {
      const media = await Media.findById(id);
      if (media && media.processedStatus === 'COMPLETED') {
        downloadLinks.push({
          id: media._id,
          filename: media.r2Key.split('/').pop(),
          url: media.r2Url, // Cloudinary URLs are public by default
        });
      }
    }

    return res.json({ downloads: downloadLinks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a media file
 */
export const deleteMedia = async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    // Validate that the request is from the owner or team member of the studio
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete this media' });
    }

    // Trigger delete in Cloudinary
    await deleteFile(media.r2Key);
    if (media.thumbnailUrl && media.thumbnailUrl.includes('res.cloudinary.com')) {
      // For cloudinary, we also need to extract public_id to delete thumbnails
      // To keep it simple, we can try to guess the publicId or just skip it if we don't have it explicitly stored.
      // Since media Worker will upload them, it will return publicId. If we stored it, we'd delete it.
      // But we didn't add a field for thumb_public_id. 
      // Actually, if we use the same public_id pattern, let's just let Cloudinary delete it if it exists.
    }

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: media._id });

    // Delete Media document
    await Media.findByIdAndDelete(mediaId);

    return res.json({ message: 'Media and associated embeddings deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk delete media (either specific IDs or all media for an event)
 */
export const deleteBulkMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { mediaIds } = req.body; // optional array of media IDs

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Validate that the request is from the owner
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete media for this event' });
    }

    // Determine query
    const query: any = { eventId };
    if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
      query._id = { $in: mediaIds };
    }

    const mediaList = await Media.find(query);
    if (mediaList.length === 0) {
      return res.json({ message: 'No media found to delete' });
    }

    const { deleteFile } = await import('../services/StorageService');

    // Delete from Cloudinary
    for (const media of mediaList) {
      await deleteFile(media.r2Key).catch(err => console.warn(`Failed to delete ${media.r2Key}:`, err));
    }

    const idsToDelete = mediaList.map(m => m._id);

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: { $in: idsToDelete } });

    // Delete Media documents
    await Media.deleteMany({ _id: { $in: idsToDelete } });

    return res.json({ message: `${mediaList.length} media items deleted successfully` });
  } catch (err: any) {
    console.error('Bulk Delete Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Uploads a whitelabel asset (logos, cover images) to Cloudflare R2 and returns its URL.
 */
export const uploadAsset = async (req: AuthRequest, res: Response) => {
  const file = req.file;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folderForCloudinary = `branding/assets`;
    const { url } = await uploadFile(file.buffer, folderForCloudinary);

    return res.json({ url });
  } catch (err: any) {
    console.error('Asset Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Generate ImageKit authentication parameters for client-side uploads
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
      const signatureData = generateSignature();
      return res.json(signatureData);
    }
  } catch (err: any) {
    console.error('ImageKit Auth Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk create media from direct client Cloudinary uploads
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

    // Enforce storage limits based on active plan (Bypass for SUPER_ADMIN)
    if (!isSuperAdmin(req.user)) {
      const planKey = (studio.subscriptionPlan || 'BASIC').toUpperCase();
      const limits: Record<string, { photos: number; videos: number }> = {
        BASIC: { photos: 50000, videos: 10 },
        STANDARD: { photos: 150000, videos: 100 },
        ESSENTIAL: { photos: 300000, videos: 200 },
        PREMIUM: { photos: 750000, videos: 500 },
        STARTER: { photos: 50000, videos: 10 },
        PROFESSIONAL: { photos: 150000, videos: 100 },
        BUSINESS: { photos: 300000, videos: 200 },
        ENTERPRISE: { photos: 750000, videos: 500 },
      };
      const planLimit = limits[planKey] || limits.BASIC;

      const newPhotosCount = mediaList.filter(m => (m.type || 'PHOTO') === 'PHOTO').length;
      const newVideosCount = mediaList.filter(m => m.type === 'VIDEO').length;

      const currentPhotos = studio.usage?.photosUploaded || 0;
      const currentVideos = studio.usage?.videosUploaded || 0;
      const pendingPhotos = await Media.countDocuments({ studioId: studio._id, type: 'PHOTO', creditDeducted: false });
      const pendingVideos = await Media.countDocuments({ studioId: studio._id, type: 'VIDEO', creditDeducted: false });

      const totalPhotos = currentPhotos + pendingPhotos;
      const totalVideos = currentVideos + pendingVideos;

      if (newPhotosCount > 0 && totalPhotos + newPhotosCount > planLimit.photos) {
        return res.status(403).json({ 
          error: `Photo storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.photos.toLocaleString('en-IN')} photos (${Math.max(0, planLimit.photos - totalPhotos)} remaining). Please upgrade your plan.` 
        });
      }
      if (newVideosCount > 0 && totalVideos + newVideosCount > planLimit.videos) {
        return res.status(403).json({ 
          error: `Video storage limit exceeded. Your ${planKey} plan allows up to ${planLimit.videos} videos (${Math.max(0, planLimit.videos - totalVideos)} remaining). Please upgrade your plan.` 
        });
      }
    }

    const newMediaDocs = mediaList.map(item => ({
      type: item.type || 'PHOTO',
      r2Key: item.publicId,
      r2Url: item.url,
      folderPath: item.folderPath || '',
      eventId: event._id,
      studioId: event.studioId,
      size: item.size || 0,
      width: item.width,
      height: item.height,
      uploadedBy: req.user!._id,
      processedStatus: 'PENDING',
      creditDeducted: false, // Will be deducted when event is saved
    }));

    // Insert all documents at once
    const insertedMedia = await Media.insertMany(newMediaDocs);

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
      console.log(`[BulkCreate] Redis offline. Processing ${offlineQueue.length} items in background.`);
      setTimeout(async () => {
        for (let i = 0; i < offlineQueue.length; i += 5) {
          const batch = offlineQueue.slice(i, i + 5);
          await Promise.all(batch.map(item => processMediaLocal(item.id, item.type, item.studioId).catch(procErr => {
            console.error(`[Sync Process Error] Failed media ${item.id}:`, procErr);
          })));
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
