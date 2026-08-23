import express from 'express';
import { getPropertyProfitability, getPortfolioSummary } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/properties', requireAuth, requireRole('landlord'), getPropertyProfitability);
router.get('/summary', requireAuth, requireRole('landlord'), getPortfolioSummary);

export default router;