import { Router } from 'express';
import {
  uploadMedia,
  getEventMedia,
  downloadBulkMedia,
  deleteMedia,
  uploadAsset,
  deleteBulkMedia,
  bulkCreateMedia,
  getImageKitAuth,
  getPresignedUploadUrls,
  streamMediaFile,
  downloadEventZip,
  batchUpscaleMedia,
  toggleMediaFavorite,
  getEventFavorites,
} from '../controllers/mediaController';
import { authenticateJWT } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Stream media directly from Cloudflare R2 with HTTP caching & video range support
router.route('/file/:key(*)').get(streamMediaFile).head(streamMediaFile);
router.route('/file/*').get(streamMediaFile).head(streamMediaFile);

// Stream full event or selected photos directly as a ZIP archive
router.get('/download-zip', downloadEventZip);
router.post('/download-zip', downloadEventZip);

// Generate presigned upload URLs for ultra-fast direct client-to-R2 uploads
router.post('/event/:eventId/presigned-urls', authenticateJWT, getPresignedUploadUrls);

// Bulk create media records after direct client upload
router.post('/event/:eventId/bulk-create', authenticateJWT, bulkCreateMedia);

// Upload single whitelabel asset (logo, watermark, cover) to R2
router.post('/upload-asset', authenticateJWT, upload.single('file'), uploadAsset);

// Upload multiple photo/video files for a specific event (backend upload / fallback)
router.post('/event/:eventId/upload', authenticateJWT, upload.any(), uploadMedia);

// Get all processed media for a specific event (public or studio dashboard view)
router.get('/event/:eventId', getEventMedia);

// Favorites endpoints
router.get('/event/:eventId/favorites', getEventFavorites);
router.put('/:mediaId/favorite', toggleMediaFavorite);

// Bulk download requested media items (with presigned R2 direct download URLs)
router.post('/download-bulk', downloadBulkMedia);

// Delete an item of media
router.delete('/:mediaId', authenticateJWT, deleteMedia);

// Bulk delete media for an event
router.delete('/event/:eventId/media', authenticateJWT, deleteBulkMedia);

// Batch upscale / resize photo media size for an event
router.put('/event/:eventId/upscale', authenticateJWT, batchUpscaleMedia);

// Legacy auth signature route (backward compatibility)
router.get('/imagekit-auth', authenticateJWT, getImageKitAuth);

export default router;
