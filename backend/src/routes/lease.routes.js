import express from 'express';
import { createLease, getMyLeases, getLeasesForLandlord, terminateLease } from '../controllers/lease.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { leaseValidation } from '../validators/lease.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('landlord'), leaseValidation, validate, createLease);
router.get('/mine', requireAuth, requireRole('tenant'), getMyLeases);
router.get('/', requireAuth, requireRole('landlord'), getLeasesForLandlord);
router.patch('/:id/terminate', requireAuth, requireRole('landlord'), terminateLease);

export default router;