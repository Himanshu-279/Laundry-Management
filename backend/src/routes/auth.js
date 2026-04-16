/**
 * Auth Routes - User Authentication and Management
 * Handles login, registration, and admin user management endpoints
 */

const express = require('express');
const router = express.Router();
const { login, register, getMe, getAllUsers, deleteUser } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { loginValidation } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');

// Rate limiter: Max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// ============ PUBLIC ENDPOINTS ============
// Login: Validate credentials and return JWT token
router.post('/login', loginLimiter, loginValidation, login);

// ============ PROTECTED ENDPOINTS (Requires JWT) ============
// Get current authenticated user profile
router.get('/me', authenticate, getMe);

// ============ ADMIN-ONLY ENDPOINTS ============
// Create new user with username, password, and role
router.post('/register', authenticate, authorizeAdmin, register);

// List all active users with system statistics
router.get('/users', authenticate, authorizeAdmin, getAllUsers);

// Soft delete a user by ID (prevents self-deletion)
router.delete('/users/:userId', authenticate, authorizeAdmin, deleteUser);

module.exports = router;
