import { Router } from 'express';
import { uploadMedia, getEventMedia, downloadBulkMedia, deleteMedia, uploadAsset, deleteBulkMedia, bulkCreateMedia, getImageKitAuth } from '../controllers/mediaController';
import { authenticateJWT } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Upload single whitelabel asset (logo, watermark, cover) to R2
router.post('/upload-asset', authenticateJWT, upload.single('file'), uploadAsset);

// Upload multiple photo/video files for a specific event
router.post('/event/:eventId/upload', authenticateJWT, upload.any(), uploadMedia);

// Get all processed media for a specific event (public or studio dashboard view)
router.get('/event/:eventId', getEventMedia);

// Bulk download requested media items
router.post('/download-bulk', downloadBulkMedia);

// Delete an item of media
router.delete('/:mediaId', authenticateJWT, deleteMedia);

// Bulk delete media for an event
router.delete('/event/:eventId/media', authenticateJWT, deleteBulkMedia);
// Bulk create media from direct client Cloudinary uploads
router.post('/event/:eventId/bulk-create', authenticateJWT, bulkCreateMedia);

// Get ImageKit upload signature
router.get('/imagekit-auth', authenticateJWT, getImageKitAuth);

export default router;
