import express from 'express';
import {
  createRequest, getMyRequests, getRequestsForLandlord, updateRequestStatus,
} from '../controllers/maintenance.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requestValidation, statusValidation } from '../validators/maintenance.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('tenant'), requestValidation, validate, createRequest);
router.get('/mine', requireAuth, requireRole('tenant'), getMyRequests);
router.get('/', requireAuth, requireRole('landlord'), getRequestsForLandlord);
router.patch('/:id/status', requireAuth, requireRole('landlord'), statusValidation, validate, updateRequestStatus);

export default router;