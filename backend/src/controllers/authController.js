const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, isActive: true }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = signToken(user._id);
    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register (admin only in production)
const register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken',
      });
    }

    const user = await User.create({ username, password, role: role || 'staff' });
    const token = signToken(user._id);

    logger.info(`New user created: ${username} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * GET /api/auth/users (Admin-only endpoint)
 * Fetch all active users with system statistics
 * 
 * Returns: { success: true, data: { users: [...], stats: { total, admins, staff } } }
 */
const getAllUsers = async (req, res, next) => {
  try {
    // Fetch active users, exclude password field, sort by creation date (newest first)
    const users = await User.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    
    // Calculate system statistics
    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      staff: users.filter(u => u.role === 'staff').length,
    };

    res.json({
      success: true,
      data: {
        users,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/users/:userId (Admin-only endpoint)
 * Soft delete a user (mark as inactive in database)
 * Prevents user from deleting their own account
 * 
 * Returns: { success: true, message: 'User deleted', data: { user: {...} } }
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Security: Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Soft delete: mark user as inactive (preserves audit trail)
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info(`User deleted: ${user.username}`);

    res.json({
      success: true,
      message: `User "${user.username}" deleted successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe, getAllUsers, deleteUser };
