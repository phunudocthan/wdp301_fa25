const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../services/emailService");

// Đăng ký user mới
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check trùng email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    await newUser.save();

    // Tạo token verify và gửi email
    const token = crypto.randomBytes(32).toString("hex");
    newUser.emailVerificationToken = token;
    newUser.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    newUser.lastVerificationEmailSentAt = new Date();
    await newUser.save();

    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;
    try {
      await sendVerificationEmail(email, verifyLink);
    } catch (e) {
      // Không fail đăng ký nếu gửi email lỗi
      console.error("Send verification email error:", e.message);
    }

    res.status(201).json({ msg: "User registered successfully. Please verify your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Yêu cầu gửi lại email xác minh (với rate limit)
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "Email already verified" });

    // Rate limit: 1 email per 5 minutes
    const now = Date.now();
    const lastSent = user.lastVerificationEmailSentAt ? user.lastVerificationEmailSentAt.getTime() : 0;
    const fiveMinutes = 5 * 60 * 1000;
    if (now - lastSent < fiveMinutes) {
      const waitMs = fiveMinutes - (now - lastSent);
      return res.status(429).json({ msg: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting again` });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(now + 60 * 60 * 1000); // 1h
    user.lastVerificationEmailSentAt = new Date(now);
    await user.save();

    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verifyLink);

    res.json({ msg: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xác minh email với token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ msg: "Token is required" });

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ msg: "Invalid token" });
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ msg: "Token expired" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
