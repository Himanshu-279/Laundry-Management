const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../config/constants');

const garmentItemSchema = new mongoose.Schema(
  {
    garmentType: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    pricePerItem: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: String,
      default: 'system',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name too long'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'],
      index: true,
    },
    garments: {
      type: [garmentItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one garment is required',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.RECEIVED,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    estimatedDeliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes too long'],
    },
    createdBy: {
      type: String,
      default: 'staff',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Pre-save hook: Generate unique order ID
 * Uses date + counter + timestamp milliseconds to ensure uniqueness
 * even when multiple orders are created simultaneously
 */
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    // Count orders created on the same day
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    
    const count = await mongoose.model('Order').countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    // Add timestamp milliseconds to counter for extra uniqueness during concurrent creates
    const uniqueSuffix = String(count + 1).padStart(3, '0');
    const timestamp = String(date.getMilliseconds()).padStart(3, '0');
    this.orderId = `LD-${dateStr}-${uniqueSuffix}${timestamp}`;
  }

  // Set estimated delivery if not set
  if (!this.estimatedDeliveryDate) {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 3);
    this.estimatedDeliveryDate = delivery;
  }

  // Initialize status history on creation
  if (this.isNew) {
    this.statusHistory = [
      {
        status: ORDER_STATUSES.RECEIVED,
        changedAt: new Date(),
        changedBy: this.createdBy || 'system',
        note: 'Order created',
      },
    ];
  }

  next();
});

// Text index for search
orderSchema.index({ customerName: 'text', phoneNumber: 'text', orderId: 'text' });

// Compound index for common queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ phoneNumber: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
