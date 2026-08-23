import express from 'express';
import {
  createProperty, getMyProperties, getPropertyById, updateProperty, deleteProperty,
} from '../controllers/property.controller.js';
import { createUnit, updateUnit, deleteUnit, getVacantUnits } from '../controllers/unit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { propertyValidation, unitValidation } from '../validators/property.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

// public/tenant browsing
router.get('/units/vacant', getVacantUnits);

// landlord-only property management
router.post('/', requireAuth, requireRole('landlord'), propertyValidation, validate, createProperty);
router.get('/', requireAuth, requireRole('landlord'), getMyProperties);
router.get('/:id', requireAuth, requireRole('landlord'), getPropertyById);
router.put('/:id', requireAuth, requireRole('landlord'), propertyValidation, validate, updateProperty);
router.delete('/:id', requireAuth, requireRole('landlord'), deleteProperty);

// landlord-only unit management, nested under a property
router.post('/:propertyId/units', requireAuth, requireRole('landlord'), unitValidation, validate, createUnit);
router.put('/units/:id', requireAuth, requireRole('landlord'), unitValidation, validate, updateUnit);
router.delete('/units/:id', requireAuth, requireRole('landlord'), deleteUnit);

export default router;