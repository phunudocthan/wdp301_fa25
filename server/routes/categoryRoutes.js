const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public category routes (for display purposes)
router.get("/tree", categoryController.getCategoryTree);

// Admin-only routes (require authentication and admin role)
router.get(
  "/",
  requireAuth,
  requireRole("admin", "customer"),
  categoryController.getCategories
);
router.get(
  "/stats",
  requireAuth,
  requireRole("admin"),
  categoryController.getCategoryStats
);
router.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  categoryController.getCategoryById
);

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  categoryController.upload.single("image"),
  categoryController.createCategory
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  categoryController.upload.single("image"),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  categoryController.deleteCategory
);

// Status management
router.patch(
  "/:id/toggle-status",
  requireAuth,
  requireRole("admin"),
  categoryController.toggleCategoryStatus
);

module.exports = router;
