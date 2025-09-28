const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountLockedEmail,
} = require("../services/emailService");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCK_TIME_MS =
  Number(process.env.LOGIN_LOCK_TIME_MS) || 2 * 60 * 60 * 1000;

const GOOGLE_AUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
);

const createVerificationToken = () => crypto.randomBytes(32).toString("hex");

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
  failedLoginAttempts: user.failedLoginAttempts || 0,
  lockUntil: user.lockUntil,
});

const getRequestMeta = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
    ? forwarded.split(",")[0]
    : undefined;

  const ip =
    forwardedIp ||
    req?.ip ||
    req?.connection?.remoteAddress ||
    req?.socket?.remoteAddress ||
    "unknown";

  return {
    ip: ip.toString().trim(),
    device: req?.get?.("User-Agent") || "Unknown",
  };
};

const resolveActivityMeta = (reqOrMeta) => {
  if (!reqOrMeta) {
    return { ip: "unknown", device: "Unknown" };
  }

  if (typeof reqOrMeta.get === "function") {
    return getRequestMeta(reqOrMeta);
  }

  return {
    ip: (reqOrMeta.ip || "unknown").toString().trim(),
    device: reqOrMeta.device || "Unknown",
  };
};

const logActivity = async (userId, action, reqOrMeta) => {
  try {
    const meta = resolveActivityMeta(reqOrMeta);

    await ActivityLog.create({
      userId,
      action,
      ip: meta.ip,
      device: meta.device,
    });
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
};

const clearExpiredLock = async (user) => {
  if (!user) return false;
  if (user.lockUntil && user.lockUntil < Date.now()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
    return true;
  }
  return false;
};

if (GOOGLE_AUTH_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: profile.emails?.[0]?.value });
            if (!user) {
              user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatar: profile.photos?.[0]?.value,
                isVerified: true,
                status: "active",
              });
            } else {
              user.googleId = profile.id;
              user.avatar = profile.photos?.[0]?.value || user.avatar;
              user.isVerified = true;
            }
          }

          await clearExpiredLock(user);
          user.failedLoginAttempts = 0;
          user.lockUntil = undefined;
          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });

          await logActivity(user._id, "Login with Google", {
            ip: "google-oauth",
            device: profile.provider || "Google",
          });

          const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

          return done(null, { user, token });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((payload, done) => {
    done(null, payload.user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

exports.googleAuthEnabled = GOOGLE_AUTH_ENABLED;

exports.handleGoogleCallback = (req, res) => {
  const { token } = req.user || {};
  if (!token) {
    return res.redirect(`${CLIENT_URL}/login?error=no_token`);
  }
  return res.redirect(`${CLIENT_URL}?token=${encodeURIComponent(token)}`);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ msg: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const token = createVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
      lastVerificationEmailSentAt: new Date(),
      verificationEmailAttempts: 1,
      status: "active",
      isVerified: false,
    });

    await newUser.save();

    const verifyLink = `${CLIENT_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(newUser.email, verifyLink);
    await logActivity(newUser._id, "Account registered", req);

    res.status(201).json({
      msg: "Registration successful. Please verify your email.",
      user: buildUserPayload(newUser),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password +passwordResetToken");
    if (!user) {
      await logActivity(null, `Failed login - unknown email (${email})`, req);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    await clearExpiredLock(user);

    if (user.status && user.status !== "active") {
      await logActivity(
        user._id,
        `Failed login - status ${user.status}`,
        req
      );
      return res.status(403).json({ msg: "Account is not active" });
    }

    if (user.isLocked) {
      const waitMs = user.lockUntil - Date.now();
      const waitMinutes = Math.max(1, Math.ceil(waitMs / 60000));
      await logActivity(user._id, "Login attempt on locked account", req);
      return res.status(423).json({
        msg: `Account is locked. Try again in ${waitMinutes} minute(s).`,
        lockUntil: user.lockUntil,
      });
    }

    if (user.googleId && !user.password) {
      return res
        .status(400)
        .json({ msg: "Please login with Google for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const willLock = attempts >= MAX_LOGIN_ATTEMPTS;

      await user.incLoginAttempts();
      user.failedLoginAttempts = attempts;

      if (willLock) {
      const lockUntilDate = new Date(Date.now() + LOCK_TIME_MS);
      user.lockUntil = lockUntilDate;
      await logActivity(user._id, "Account locked due to failed logins", req);
      await sendAccountLockedEmail(user.email, lockUntilDate).catch((error) =>
        console.error("sendAccountLockedEmail error:", error)
      );

      const lockMessage = "Too many failed attempts. Account locked temporarily.";
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((lockUntilDate.getTime() - Date.now()) / 1000)
      );

      return res.status(423).json({
        msg: lockMessage,
        message: lockMessage,
        lockUntil: lockUntilDate,
        retryAfterSeconds,
      });
    }

      const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);

      await logActivity(user._id, "Failed login - wrong password", req);

      const attemptMessage =
        attemptsRemaining > 0
        ? `Invalid credentials. ${attemptsRemaining} attempt(s) remaining.`
        : "Invalid credentials.";

      return res.status(400).json({
      msg: attemptMessage,
      message: attemptMessage,
      attemptsRemaining,
    });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: "Please verify your email first." });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await logActivity(user._id, "Login successful", req);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      msg: "Login successful",
      token,
      user: buildUserPayload(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ msg: "Email already verified" });

    const now = Date.now();
    const lastSent = user.lastVerificationEmailSentAt
      ? user.lastVerificationEmailSentAt.getTime()
      : 0;

    const fiveMinutes = 5 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastSent < fiveMinutes) {
      const waitMs = fiveMinutes - (now - lastSent);
      return res.status(429).json({
        msg: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting again`,
      });
    }

    if (user.verificationEmailAttempts >= 3 && now - lastSent < oneDay) {
      return res.status(429).json({
        msg: "Too many verification requests. Please try again later.",
      });
    }

    if (now - lastSent >= oneDay) {
      user.verificationEmailAttempts = 0;
    }

    const token = createVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(now + 60 * 60 * 1000);
    user.lastVerificationEmailSentAt = new Date(now);
    user.verificationEmailAttempts = (user.verificationEmailAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });

    const verifyLink = `${CLIENT_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verifyLink);

    res.json({ msg: "Verification email sent" });
  } catch (err) {
    console.error("requestEmailVerification error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  return exports.requestEmailVerification(req, res);
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ msg: "Token is required" });

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ msg: "Invalid token" });

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({ msg: "Token expired" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.verificationEmailAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await logActivity(user._id, "Email verified", req);

    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await logActivity(
        null,
        `Password reset requested for unknown email (${email})`,
        req
      );
      return res.status(404).json({ msg: "User not found" });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
    await logActivity(user._id, "Password reset requested", req);

    try {
      await sendPasswordResetEmail(user.email, resetLink);
      res.json({
        msg: "Password reset link sent to your email",
      });
    } catch (emailError) {
      console.error("Password reset email error:", emailError);
      res.json({
        msg: "Password reset requested. Email delivery failed, provide token manually.",
        resetToken,
      });
    }
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Please provide new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password +passwordResetToken");

    if (!user) {
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });

    await logActivity(user._id, "Password reset successful", req);

    res.json({ msg: "Password reset successful" });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(buildUserPayload(user));
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.unlockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.status = "active";
    await user.save({ validateBeforeSave: false });

    await logActivity(
      req.user.id,
      `Unlocked account for ${user.email}`,
      req
    );

    res.json({ msg: "Account unlocked successfully" });
  } catch (error) {
    console.error("unlockAccount error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

