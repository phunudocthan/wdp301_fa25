const express = require("express");
const Lego = require("../models/Lego");
const Order = require("../models/Order");
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
  getProductByCategoryID,
} = require("../controllers/productController");

const router = express.Router();

/**
 * @route   GET /api/products/best-sell
 * @desc    Get top 10 best-selling products
 * @access  Public
 */
const getBestSellProducts = async (req, res) => {
  try {
    const bestSellProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.legoId",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "legos",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $project: { _id: 0, product: 1, totalSold: 1 } },
    ]);

    res.json({
      count: bestSellProducts.length,
      products: bestSellProducts.map((p) => ({
        ...p.product,
        totalSold: p.totalSold,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching best sell products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

// ===============================
// PUBLIC ROUTES
// ===============================

/**
 * @route   GET /api/products/best-sell
 * @desc    Get best-selling products
 * @access  Public
 */
router.get("/best-sell", getBestSellProducts);

/**
 * @route   GET /api/products/category_list/:id
 * @desc    Get products by category ID
 * @access  Public
 */
router.get("/category_list/:id", getProductByCategoryID);

/**
 * @route   GET /api/products
 * @desc    Fetch public product list with optional search/filter/sort
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { search, theme, minPrice, maxPrice, status, sortBy } = req.query;
    let filter = {};

    // 🔍 Search theo tên hoặc mô tả
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 🎨 Filter theo themeId
    if (theme) {
      filter.themeId = theme;
    }

    // ✅ Filter theo status
    if (status) {
      filter.status = status;
    }

    // 💰 Filter theo price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ↕️ Sort
    let sort = {};
    if (sortBy === "price_asc") sort.price = 1;
    if (sortBy === "price_desc") sort.price = -1;
    if (sortBy === "newest") sort.createdAt = -1;

    const products = await Lego.find(filter).sort(sort);

    res.json({
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

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
    console.error("❌ Error fetching product:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
