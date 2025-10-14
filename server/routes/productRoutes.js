const express = require("express");
const Lego = require("../models/Lego");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductStats,
  getUncategorizedProductsCount,
} = require("../controllers/productController");

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Fetch public product list with optional search/filter/sort
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { search, theme, minPrice, maxPrice, status, sortBy } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (theme) {
      filter.themeId = theme;
    }

    if (status) {
      filter.status = status;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sort = {};
    if (sortBy === "price_asc") sort.price = 1;
    if (sortBy === "price_desc") sort.price = -1;
    if (sortBy === "newest") sort.createdAt = -1;

    const products = await Lego.find(filter).sort(sort);

    res.json({
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// ADMIN ROUTES - PRODUCT MANAGEMENT
// ===============================

router.get("/admin/stats", requireAuth, requireRole("admin"), getProductStats);

router.get(
  "/admin/uncategorized/count",
  requireAuth,
  requireRole("admin"),
  getUncategorizedProductsCount
);

router.get("/admin", requireAuth, requireRole("admin"), getAllProducts);

router.get("/admin/:id", requireAuth, requireRole("admin"), getProductById);

router.post("/admin", requireAuth, requireRole("admin"), createProduct);

router.put("/admin/:id", requireAuth, requireRole("admin"), updateProduct);

router.patch(
  "/admin/:id/status",
  requireAuth,
  requireRole("admin"),
  updateProductStatus
);

router.delete("/admin/:id", requireAuth, requireRole("admin"), deleteProduct);

/**
 * @route   GET /api/products/:id
 * @desc    Fetch single product detail (public)
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Lego.findById(req.params.id)
      .populate("themeId", "name description")
      .populate("ageRangeId", "rangeLabel minAge maxAge")
      .populate("difficultyId", "label level")
      .populate("createdBy", "name email role");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
