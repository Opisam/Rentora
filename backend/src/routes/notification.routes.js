import express from 'express';
import { getMyNotifications, markNotificationRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, getMyNotifications);
router.patch('/:id/read', requireAuth, markNotificationRead);

export default router;