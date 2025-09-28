const express = require("express");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many verification requests. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/request-verify-email", authController.requestEmailVerification);
router.post(
  "/resend-verification-email",
  resendVerificationLimiter,
  authController.resendVerificationEmail
);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword
);
router.post(
  "/reset-password/:token",
  forgotPasswordLimiter,
  authController.resetPassword
);

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

router.get("/me", requireAuth, authController.getMe);

router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({
    message: "Welcome, admin!",
    user: req.user,
  });
});

router.post(
  "/unlock/:userId",
  requireAuth,
  requireRole("admin"),
  authController.unlockAccount
);

module.exports = router;
