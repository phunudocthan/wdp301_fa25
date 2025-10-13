const express = require("express");
const {
  getRevenueStats,
  getOrderStats,
  listUsers,
  getUserDetail,
  toggleUserStatus,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard/revenue", getRevenueStats);
router.get("/dashboard/orders", getOrderStats);

router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/status", toggleUserStatus);

module.exports = router;
