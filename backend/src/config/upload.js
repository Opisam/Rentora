import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || 'uploads/', // configurable so tests can isolate writes
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// only allow specific file types — size capped at 5MB below (security basics for uploads)
export function fileFilter(req, file, cb) {
  const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error('File type not allowed'));
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export default upload;
