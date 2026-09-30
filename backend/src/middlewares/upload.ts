import multer from 'multer';

// In-memory buffer upload
const storage = multer.memoryStorage();

// Max file sizes (e.g. 50MB for photos, 500MB for videos)
export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max limit
  },
});
