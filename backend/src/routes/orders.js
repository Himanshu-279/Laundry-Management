const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboard,
  getGarmentPrices,
} = require('../controllers/orderController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const {
  createOrderValidation,
  updateStatusValidation,
  listOrdersValidation,
} = require('../middleware/validators');

// All order routes require authentication
router.use(authenticate);

// Dashboard (must come before /:orderId route)
router.get('/dashboard', getDashboard);
router.get('/garments/prices', getGarmentPrices);

// CRUD
router.post('/', createOrderValidation, createOrder);
router.get('/', listOrdersValidation, getOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateStatusValidation, updateOrderStatus);
router.delete('/:orderId', authorizeAdmin, deleteOrder);

module.exports = router;
