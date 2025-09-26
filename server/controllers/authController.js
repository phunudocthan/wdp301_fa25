const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { 
  sendPasswordResetEmail, 
  sendAccountLockedEmail, 
  sendWelcomeEmail 
} = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Log user activity
const logActivity = async (userId, action, ip, userAgent) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      ip,
      device: userAgent || 'Unknown',
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logActivity(null, `Failed login attempt - email not found: ${email}`, ip, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await logActivity(user._id, 'Login attempt on locked account', ip, userAgent);
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTime} minutes.`,
        lockUntil: user.lockUntil,
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      await logActivity(user._id, `Login attempt on ${user.status} account`, ip, userAgent);
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      await logActivity(user._id, 'Failed login attempt - wrong password', ip, userAgent);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - (user.failedLoginAttempts + 1)),
      });
    }

    // Successful login - reset failed attempts and update last login
    await user.resetLoginAttempts();
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Log successful login
    await logActivity(user._id, 'Successful login', ip, userAgent);

    // Generate token
    const token = generateToken(user._id);

    // Remove sensitive data
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'customer' } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isEmailVerified: false,
    });

    // Log registration
    await logActivity(user._id, 'User registered', ip, userAgent);

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address',
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      await logActivity(null, `Password reset attempt - email not found: ${email}`, ip, userAgent);
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address',
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Log password reset request
    await logActivity(user._id, 'Password reset requested', ip, userAgent);

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Still return success but log the email failure
      res.status(200).json({
        success: true,
        message: 'Password reset requested. If email service is configured, you will receive a reset link.',
        resetToken, // Include token when email fails (for development)
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password',
      });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Find user by token and check if token is still valid
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and remove reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    // Log password reset
    await logActivity(user._id, 'Password reset successful', ip, userAgent);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Unlock user account (Admin only)
// @route   POST /api/auth/unlock/:userId
// @access  Private/Admin
const unlockAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Reset login attempts
    await user.resetLoginAttempts();
    
    // Log unlock action
    await logActivity(req.user.id, `Unlocked account for user: ${user.email}`, req.ip, req.get('User-Agent'));

    res.status(200).json({
      success: true,
      message: 'Account unlocked successfully',
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  unlockAccount,
};
