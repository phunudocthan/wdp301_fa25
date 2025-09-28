const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { sendVerificationEmail } = require("../services/emailService");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const GOOGLE_AUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
);

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

          user.lastLogin = new Date();
          await user.save();

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

const createVerificationToken = () => crypto.randomBytes(32).toString("hex");

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  isEmailVerified: user.isVerified,
});

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
      return res.status(400).json({ msg: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const token = createVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
    });

    await newUser.save();

    const verifyLink = `${CLIENT_URL}/verify-email?token=${token}`;
    try {
      await sendVerificationEmail(email, verifyLink);
    } catch (emailError) {
      console.error("Send verification email error:", emailError.message);
    }

    res.status(201).json({ msg: "User registered successfully. Please verify your email." });
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ msg: "Please login with Google for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: "Please verify your email first." });
    }

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

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
    if (user.isVerified) return res.status(400).json({ msg: "Email already verified" });

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
    await user.save();

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
    await user.save();

    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).json({ error: err.message });
  }
};
