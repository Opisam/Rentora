import { body } from 'express-validator';

export const requestValidation = [
  body('unitId').isInt().withMessage('Valid unitId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
];

export const statusValidation = [
  body('status').isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status'),
];