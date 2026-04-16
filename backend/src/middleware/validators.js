const { body, param, query, validationResult } = require('express-validator');
const { ORDER_STATUSES, GARMENT_PRICES } = require('../config/constants');

// Centralized validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const createOrderValidation = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),

  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian phone number'),

  body('garments')
    .isArray({ min: 1 }).withMessage('At least one garment is required'),

  body('garments.*.garmentType')
    .trim()
    .notEmpty().withMessage('Garment type is required')
    .toUpperCase(),

  body('garments.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),

  body('garments.*.pricePerItem')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),

  validate,
];

const updateStatusValidation = [
  param('orderId').notEmpty().withMessage('Order ID is required'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(ORDER_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUSES).join(', ')}`),
  body('note').optional().trim().isLength({ max: 200 }),
  validate,
];

const listOrdersValidation = [
  query('status')
    .optional()
    .isIn(Object.values(ORDER_STATUSES))
    .withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validate,
];

module.exports = {
  loginValidation,
  createOrderValidation,
  updateStatusValidation,
  listOrdersValidation,
};
