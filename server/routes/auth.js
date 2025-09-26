const express = require('express');
const {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  unlockAccount,
} = require('../controllers/authController');

const {
  protect,
  restrictTo,
  rateLimitAuth,
  logActivity,
  validateEmail,
  validatePassword,
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', 
  rateLimitAuth(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  validateEmail,
  validatePassword,
  logActivity('Registration attempt'),
  register
);

router.post('/login', 
  rateLimitAuth(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateEmail,
  logActivity('Login attempt'),
  login
);

router.post('/forgot-password', 
  rateLimitAuth(3, 60 * 60 * 1000), // 3 attempts per hour
  validateEmail,
  logActivity('Password reset request'),
  forgotPassword
);

router.post('/reset-password/:token', 
  rateLimitAuth(3, 60 * 60 * 1000), // 3 attempts per hour
  validatePassword,
  logActivity('Password reset attempt'),
  resetPassword
);

// Protected routes
router.get('/me', 
  protect, 
  logActivity('Profile access'),
  getMe
);

// Admin only routes
router.post('/unlock/:userId', 
  protect, 
  restrictTo('admin'),
  logActivity('Account unlock attempt'),
  unlockAccount
);

module.exports = router;
