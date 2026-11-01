import multer from 'multer';

// In-memory buffer upload
const storage = multer.memoryStorage();

// Max file sizes (e.g. 100MB for photos, 1GB for high-res 4K videos)
export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max limit
    files: 250, // allow up to 250 files per multipart batch
  },
});
