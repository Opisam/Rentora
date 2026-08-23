import { body } from 'express-validator';

export const expenseValidation = [
  body('category').isIn(['repairs', 'insurance', 'taxes', 'utilities', 'management_fees', 'other'])
    .withMessage('Invalid category'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('description').optional().trim(),
];