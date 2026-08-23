import express from 'express';
import {
  applyToUnit, getMyApplications, getApplicationsForLandlord, updateApplicationStatus,
} from '../controllers/application.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { applicationStatusValidation } from '../validators/application.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/units/:unitId/apply', requireAuth, requireRole('tenant'), applyToUnit);
router.get('/mine', requireAuth, requireRole('tenant'), getMyApplications);
router.get('/', requireAuth, requireRole('landlord'), getApplicationsForLandlord);
router.patch('/:id/status', requireAuth, requireRole('landlord'), applicationStatusValidation, validate, updateApplicationStatus);

export default router;