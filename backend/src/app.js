const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === '/api/health',
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Laundry Order Management System',
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Laundry Order Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      health: '/api/health',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
