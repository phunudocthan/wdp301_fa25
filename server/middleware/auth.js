const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active',
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this resource',
      });
    }
    next();
  };
};

// Rate limiting middleware for authentication endpoints
const rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }

    if (!attempts.has(key)) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return next();
    }

    const data = attempts.get(key);
    
    if (now - data.firstAttempt > windowMs) {
      // Reset window
      attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return next();
    }

    if (data.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts, please try again later',
        retryAfter: Math.ceil((windowMs - (now - data.firstAttempt)) / 1000),
      });
    }

    data.count++;
    next();
  };
};

// Activity logging middleware
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user ? req.user._id : null;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      await ActivityLog.create({
        userId,
        action,
        ip,
        device: userAgent || 'Unknown',
      });
    } catch (error) {
      console.error('Activity logging error:', error);
    }
    next();
  };
};

// Validate account status middleware
const validateAccountStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if account status changed
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account status has changed, please re-authenticate',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTime} minutes.`,
      });
    }

    // Update user object in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Account validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account validation',
    });
  }
};

// Email validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  next();
};

// Password validation middleware
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Add more password complexity rules if needed
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasNonalphas = /\W/.test(password);

  next();
};

module.exports = {
  protect,
  restrictTo,
  rateLimitAuth,
  logActivity,
  validateAccountStatus,
  validateEmail,
  validatePassword,
};
