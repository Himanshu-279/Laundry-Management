/**
 * Seed Script: Generate 500 Test Orders
 * Creates realistic test data with random statuses, garments, and automatic billing
 * 
 * Usage:
 *   node seedOrders.js          # Add 500 orders to existing data
 *   node seedOrders.js --clear  # Clear existing orders first, then seed new ones
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./src/models/Order');
const { ORDER_STATUSES } = require('./src/config/constants');

// Sample data for generating realistic test orders
const GARMENT_TYPES = [
  'SHIRT', 'PANTS', 'SUIT', 'DRESS', 'JACKET', 'BEDSHEET', 
  'TOWEL', 'SWEATER', 'SKIRT', 'POLO'
];

const CUSTOMER_NAMES = [
  'Raj Kumar', 'Priya Singh', 'Amit Patel', 'Neha Sharma', 'Vikram Gupta', 
  'Anjali Verma', 'Arjun Malhotra', 'Diya Nair', 'Rohit Iyer', 'Pooja Chopra'
];

// Status distribution probabilities (must total 1.0)
const statusDistribution = {
  [ORDER_STATUSES.RECEIVED]: 0.20,    // 20% - ~100 orders
  [ORDER_STATUSES.PROCESSING]: 0.30,  // 30% - ~150 orders
  [ORDER_STATUSES.READY]: 0.25,       // 25% - ~125 orders
  [ORDER_STATUSES.DELIVERED]: 0.25,   // 25% - ~125 orders
};

// Utility: Get random element from array
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate random order status based on probability distribution
const generateRandomStatus = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [status, probability] of Object.entries(statusDistribution)) {
    cumulative += probability;
    if (rand < cumulative) return status;
  }
  
  return ORDER_STATUSES.DELIVERED;
};

// Generate 1-3 random garments for an order with varying quantities and prices
const generateGarments = () => {
  const garmentCount = Math.floor(Math.random() * 3) + 1; // 1-3 garments
  const garments = [];
  
  for (let i = 0; i < garmentCount; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const pricePerItem = Math.round((Math.random() * 300 + 100) * 100) / 100;
    const subtotal = Math.round(quantity * pricePerItem * 100) / 100;
    
    garments.push({
      garmentType: getRandomElement(GARMENT_TYPES),
      quantity,
      pricePerItem,
      subtotal,
    });
  }
  
  return garments;
};

// Build status history: creates audit trail from RECEIVED to current status
const generateStatusHistory = (status) => {
  const histories = [
    {
      status: ORDER_STATUSES.RECEIVED,
      changedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      changedBy: 'staff',
      note: 'Order received'
    }
  ];
  
  const statusOrder = [ORDER_STATUSES.RECEIVED, ORDER_STATUSES.PROCESSING, ORDER_STATUSES.READY, ORDER_STATUSES.DELIVERED];
  const currentIndex = statusOrder.indexOf(status);
  
  for (let i = 1; i <= currentIndex; i++) {
    const prevDate = histories[i - 1].changedAt;
    const newDate = new Date(prevDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
    
    histories.push({
      status: statusOrder[i],
      changedAt: newDate,
      changedBy: 'staff',
      note: `Status updated to ${statusOrder[i]}`
    });
  }
  
  return histories;
};

// Main seeding function: connect to DB, generate orders, insert in batches
const seedOrders = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count existing orders
    const existingCount = await Order.countDocuments();
    console.log(`📊 Existing orders: ${existingCount}`);

    // Delete existing orders for fresh start (optional)
    const clearDb = process.argv.includes('--clear');
    if (clearDb) {
      await Order.deleteMany({});
      console.log('🗑️  Cleared existing orders\n');
    }

    console.log('🌱 Creating 500 orders with different statuses...\n');
    
    const orders = [];
    const statusCounts = {
      [ORDER_STATUSES.RECEIVED]: 0,
      [ORDER_STATUSES.PROCESSING]: 0,
      [ORDER_STATUSES.READY]: 0,
      [ORDER_STATUSES.DELIVERED]: 0,
    };

    // Helper function to generate unique orderId
    const generateOrderId = (index) => {
      const date = new Date();
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      return `LD-${dateStr}-${String(index + 1).padStart(4, '0')}`;
    };

    // Generate 500 orders
    for (let i = 0; i < 500; i++) {
      const status = generateRandomStatus();
      statusCounts[status]++;
      
      const garments = generateGarments();
      const totalAmount = Math.round(garments.reduce((sum, g) => sum + g.subtotal, 0) * 100) / 100;
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);

      orders.push({
        orderId: generateOrderId(i),
        customerName: getRandomElement(CUSTOMER_NAMES) + ` #${i + 1}`,
        phoneNumber: `${Math.floor(Math.random() * 4) + 6}${Math.floor(Math.random() * 999999999).toString().padStart(9, '0')}`,
        garments,
        totalAmount,
        status,
        statusHistory: generateStatusHistory(status),
        estimatedDeliveryDate,
        notes: `Order #${i + 1} - Auto-generated for testing`,
        createdBy: 'admin',
      });
    }

    // Insert in batches
    console.log('⏳ Inserting orders in batches...');
    const batchSize = 50;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Order.insertMany(batch);
      process.stdout.write(`\r✨ Inserted ${Math.min(i + batchSize, orders.length)}/500 orders`);
    }

    console.log('\n\n📈 Status Distribution:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / 500) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 25)) + '░'.repeat(20 - Math.floor(count / 25));
      console.log(`${status.padEnd(12)} : ${bar} ${count} (${percentage}%)`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ All 500 orders created successfully!');
    console.log('🎉 Dashboard ab bilkul phate hue se dikha dega!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error.message);
    process.exit(1);
  }
};

// Run the seeder
seedOrders();
