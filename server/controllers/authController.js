const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Giới hạn tốc độ cho gửi lại email xác thực
const resendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Giới hạn 3 yêu cầu mỗi giờ cho mỗi IP
  message: {
    message: "Quá nhiều yêu cầu gửi lại email. Vui lòng thử lại sau.",
  },
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      verificationToken,
    });
    await user.save();
    const savedUser = await User.findOne({ email });
    console.log("User registered with token:", {
      email,
      verificationToken: savedUser.verificationToken,
    });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác thực email của bạn",
      html: `<p>Vui lòng xác thực email của bạn bằng cách nhấp <a href="${verificationUrl}">vào đây</a></p>`,
    });

    res
      .status(201)
      .json({
        message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
      });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không hợp lệ" });
    }

    if (!user.isEmailVerified) {
      return res
        .status(400)
        .json({ message: "Vui lòng xác thực email trước." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      await user.save();
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không hợp lệ" });
    }

    user.failedLoginAttempts = 0;
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log("Verification token received:", token);

    if (!token) {
      return res.status(400).json({ message: "Không cung cấp token xác thực" });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      console.log("No user found with token:", token);
      const verifiedUser = await User.findOne({
        email: {
          $in: [
            "phamhaidang2901@gmail.com",
            "customer@lego.com",
            "dangphce171836@fpt.edu.vn",
          ],
        },
        isEmailVerified: true,
      });
      if (verifiedUser) {
        console.log("User already verified with email:", verifiedUser.email);
        return res.status(200).json({
          message: "Liên kết xác thực này đã được sử dụng. Vui lòng đăng nhập.",
        });
      }
      const allUsers = await User.find();
      console.log(
        "All users with verificationToken:",
        allUsers.map((u) => ({
          email: u.email,
          verificationToken: u.verificationToken,
        }))
      );
      return res
        .status(400)
        .json({ message: "Liên kết xác thực này không còn hợp lệ." });
    }

    if (user.isEmailVerified) {
      console.log("User already verified:", user.email);
      return res
        .status(200)
        .json({ message: "Email đã được xác thực. Bạn có thể đăng nhập." });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    console.log("User verified successfully:", user.email);

    res
      .status(200)
      .json({ message: "Email xác thực thành công. Bạn có thể đăng nhập." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.resendVerificationEmail = [
  resendEmailLimiter,
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email là bắt buộc" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      if (user.isEmailVerified) {
        return res
          .status(400)
          .json({ message: "Email đã được xác thực. Vui lòng đăng nhập." });
      }

      const now = new Date();
      const lastSent = user.lastVerificationEmailSent
        ? new Date(user.lastVerificationEmailSent)
        : null;
      const timeSinceLastSent = lastSent ? now - lastSent : Infinity;
      const maxAttempts = 3;
      const oneDay = 24 * 60 * 60 * 1000;

      if (
        user.verificationEmailAttempts >= maxAttempts &&
        timeSinceLastSent < oneDay
      ) {
        return res.status(429).json({
          message:
            "Quá nhiều yêu cầu gửi email xác thực. Vui lòng thử lại sau 24 giờ.",
        });
      }

      if (timeSinceLastSent >= oneDay) {
        user.verificationEmailAttempts = 0;
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationToken = verificationToken;
      user.lastVerificationEmailSent = now;
      user.verificationEmailAttempts += 1;
      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Xác thực email của bạn",
        html: `<p>Vui lòng xác thực email của bạn bằng cách nhấp <a href="${verificationUrl}">vào đây</a></p>`,
      });

      res
        .status(200)
        .json({ message: "Email xác thực đã được gửi thành công." });
    } catch (error) {
      console.error("Lỗi khi gửi lại email xác thực:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
];
