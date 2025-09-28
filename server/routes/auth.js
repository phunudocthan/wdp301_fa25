const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification-email",
  authController.resendVerificationEmail
);

module.exports = router;
