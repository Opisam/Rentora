import { body } from 'express-validator';

export const propertyValidation = [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
];

export const unitValidation = [
  body('unitNumber').trim().notEmpty().withMessage('Unit number is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative number'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative number'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
  body('status').optional().isIn(['vacant', 'occupied']).withMessage('Status must be vacant or occupied'),
];