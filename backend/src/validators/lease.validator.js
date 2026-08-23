import { body } from 'express-validator';

export const leaseValidation = [
  body('applicationId').isInt().withMessage('Valid applicationId is required'),
  body('startDate').isISO8601().withMessage('Valid startDate is required (YYYY-MM-DD)'),
  body('endDate').isISO8601().withMessage('Valid endDate is required (YYYY-MM-DD)'),
  body('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
];