const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Apply authentication to all routes
router.use(requireAuth);

// Public category routes (for display purposes)
router.get("/tree", categoryController.getCategoryTree);

// Admin-only routes
router.use(requireRole("admin"));

// CRUD routes
router.get("/", categoryController.getCategories);
router.get("/stats", categoryController.getCategoryStats);
router.get("/:id", categoryController.getCategoryById);

router.post(
  "/",
  categoryController.upload.single("image"),
  categoryController.createCategory
);

router.put(
  "/:id",
  categoryController.upload.single("image"),
  categoryController.updateCategory
);

router.delete("/:id", categoryController.deleteCategory);

// Status management
router.patch("/:id/toggle-status", categoryController.toggleCategoryStatus);

module.exports = router;
