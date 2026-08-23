import { body } from 'express-validator';

export const applicationStatusValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
];