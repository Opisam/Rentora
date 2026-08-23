import express from 'express';
import { createExpense, getExpensesForProperty, deleteExpense } from '../controllers/expense.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { expenseValidation } from '../validators/expense.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/:propertyId', requireAuth, requireRole('landlord'), expenseValidation, validate, createExpense);
router.get('/:propertyId', requireAuth, requireRole('landlord'), getExpensesForProperty);
router.delete('/:id', requireAuth, requireRole('landlord'), deleteExpense);

export default router;