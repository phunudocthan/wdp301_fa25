const express = require("express");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many verification requests. Please try again later." },
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/request-verify-email", authController.requestEmailVerification);
router.post(
  "/resend-verification-email",
  resendVerificationLimiter,
  authController.resendVerificationEmail
);
router.get("/verify-email", authController.verifyEmail);

if (authController.googleAuthEnabled) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    authController.handleGoogleCallback
  );
}

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json(user);
  } catch (err) {
    console.error("Me route error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({
    message: "Welcome, admin!",
    user: req.user,
  });
});

module.exports = router;
