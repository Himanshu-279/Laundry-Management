require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const seedAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });

    if (!adminExists) {
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
      });
      logger.info('✅ Default admin user created (admin/admin123) — change password in production!');
    }
  } catch (err) {
    logger.error('Seed error:', err.message);
  }
};

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`📡 API: http://localhost:${PORT}/api`);
    logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
    shutdown('unhandledRejection');
  });
};

startServer();
