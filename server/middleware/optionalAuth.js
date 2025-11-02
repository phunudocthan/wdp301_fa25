const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Attach req.user if Authorization header contains a valid Bearer token.
 * Unlike requireAuth, it never blocks the request – just sets user or leaves it undefined.
 */
module.exports = async function attachUserOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return next();
    }

    // Skip locked / inactive users
    if (
      (user.status && user.status !== "active") ||
      (user.isLocked && user.lockUntil && user.lockUntil > Date.now())
    ) {
      return next();
    }

    req.user = user;
  } catch (error) {
    // Ignore optional auth errors, just proceed without user
    console.warn("[optionalAuth] Failed to attach user:", error.message);
  }

  return next();
};

