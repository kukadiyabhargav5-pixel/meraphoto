import multer from 'multer';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disk temporary storage: streams chunks directly to disk instead of holding entire files in RAM.
// Prevents Out-Of-Memory (OOM) crashes on low-memory servers (e.g. Render 512MB RAM).
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `mara_up_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max limit per file
    files: 500, // allow up to 500 files per batch
  },
});
