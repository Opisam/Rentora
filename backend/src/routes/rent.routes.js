import express from 'express';
import {
  triggerRentGeneration, getMyRentHistory, getRentForLandlord, markRentPaid,
} from '../controllers/rent.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/generate', requireAuth, requireRole('landlord'), triggerRentGeneration); // manual/testing
router.get('/mine', requireAuth, requireRole('tenant'), getMyRentHistory);
router.get('/', requireAuth, requireRole('landlord'), getRentForLandlord);
router.patch('/:id/pay', requireAuth, requireRole('landlord'), markRentPaid);

export default router;