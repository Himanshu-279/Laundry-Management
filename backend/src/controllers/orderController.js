const Order = require('../models/Order');
const { GARMENT_PRICES, VALID_STATUS_TRANSITIONS } = require('../config/constants');
const logger = require('../config/logger');

// Helper: calculate bill from garments
const calculateGarments = (garments) => {
  return garments.map((item) => {
    const garmentKey = item.garmentType.toUpperCase();
    const configPrice = GARMENT_PRICES[garmentKey]?.price;
    const pricePerItem = item.pricePerItem !== undefined ? item.pricePerItem : (configPrice || 50);
    const subtotal = pricePerItem * item.quantity;
    return {
      garmentType: garmentKey,
      quantity: item.quantity,
      pricePerItem,
      subtotal,
    };
  });
};

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { customerName, phoneNumber, garments, notes } = req.body;

    const processedGarments = calculateGarments(garments);
    const totalAmount = processedGarments.reduce((sum, g) => sum + g.subtotal, 0);

    let order;
    let retries = 0;
    const maxRetries = 3;

    // Retry mechanism for handling race conditions on orderId generation
    while (retries < maxRetries) {
      try {
        order = await Order.create({
          customerName,
          phoneNumber,
          garments: processedGarments,
          totalAmount,
          notes,
          createdBy: req.user?.username || 'staff',
        });
        break; // Success, exit loop
      } catch (err) {
        retries++;
        // If it's a duplicate key error on orderId, retry
        if (err.code === 11000 && err.keyPattern?.orderId && retries < maxRetries) {
          console.log(`OrderId collision detected, retrying... (attempt ${retries}/${maxRetries})`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * retries));
          continue;
        }
        // For other errors, throw immediately
        throw err;
      }
    }

    if (!order) {
      return res.status(409).json({
        success: false,
        message: 'Failed to generate unique order ID. Please try again.',
      });
    }

    logger.info(`Order created: ${order.orderId} for ${customerName}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      search,
      garmentType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { orderId: searchRegex },
      ];
    }

    if (garmentType) {
      filter['garments.garmentType'] = garmentType.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: skip + orders.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:orderId
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${req.params.orderId} not found`,
      });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:orderId/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`,
      });
    }

    const validNextStatuses = VALID_STATUS_TRANSITIONS[order.status];
    if (!validNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}. Valid next: ${validNextStatuses.join(', ') || 'none'}`,
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user?.username || 'staff',
      note: note || '',
    });

    await order.save();

    logger.info(`Order ${orderId} status updated: ${status} by ${req.user?.username}`);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/orders/:orderId (admin only)
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${req.params.orderId} not found`,
      });
    }

    logger.info(`Order deleted: ${req.params.orderId} by ${req.user?.username}`);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [statusAgg, revenueAgg, recentOrders, todayOrders] = await Promise.all([
      // Orders per status
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Total revenue and order count
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),

      // Recent 5 orders
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),

      // Today's orders
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const statusMap = {};
    statusAgg.forEach((s) => { statusMap[s._id] = s.count; });

    const summary = revenueAgg[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    const today = todayOrders[0] || { count: 0, revenue: 0 };

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: summary.totalOrders,
          totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
          avgOrderValue: Math.round(summary.avgOrderValue * 100) / 100,
        },
        today: {
          orders: today.count,
          revenue: Math.round((today.revenue || 0) * 100) / 100,
        },
        ordersByStatus: {
          RECEIVED: statusMap.RECEIVED || 0,
          PROCESSING: statusMap.PROCESSING || 0,
          READY: statusMap.READY || 0,
          DELIVERED: statusMap.DELIVERED || 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/garments/prices
const getGarmentPrices = async (req, res) => {
  res.json({
    success: true,
    data: { garments: GARMENT_PRICES },
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboard,
  getGarmentPrices,
};
