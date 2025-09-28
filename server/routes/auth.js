const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification-email",
  authController.resendVerificationEmail
);

// Routes cho Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("Google OAuth callback triggered");
    console.log("User object:", req.user);
    const { token } = req.user;
    if (!token) {
      console.error("No token generated");
      return res.redirect("http://localhost:3000/login?error=no_token");
    }
    console.log("Redirecting with token:", token);
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

module.exports = router;
