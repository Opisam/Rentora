import express from 'express';
import multer from 'multer';
import { uploadDocument, getDocumentsForLease } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import upload from '../config/upload.js';

const router = express.Router();

router.post('/:leaseId', requireAuth, upload.single('file'), uploadDocument);
router.get('/:leaseId', requireAuth, getDocumentsForLease);

// map upload filter/limit failures to client errors instead of a generic 500
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'File type not allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
