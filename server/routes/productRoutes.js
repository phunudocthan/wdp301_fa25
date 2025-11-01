const express = require("express");
const Lego = require("../models/Lego");
const Order = require("../models/Order");
const Theme = require("../models/Theme");
const AgeRange = require("../models/AgeRange");
const Difficulty = require("../models/Difficulty");
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
  getRecentlyViewedProducts,
  getProductsByTheme,
  getProductsByCharacter,
} = require("../controllers/productController");

const router = express.Router();

// ===============================
// 🔹 ADMIN ROUTES - PRODUCT MANAGEMENT
// ===============================

/**
 * ⚠️ Lưu ý:
 * Express đọc route theo thứ tự.
 * -> Route tĩnh (vd: /admin/stats) phải đặt TRƯỚC route động (vd: /admin/:id)
 */

// ✅ Route thống kê sản phẩm (phải nằm TRƯỚC /admin/:id)
router.get("/admin/stats", requireAuth, requireRole("admin"), getProductStats);

/**
 * @route   GET /api/products/admin/uncategorized/count
 * @desc    Lấy số sản phẩm chưa phân loại
 * @access  Private (Admin)
 */
router.get(
  "/admin/uncategorized/count",
  requireAuth,
  requireRole("admin"),
  getUncategorizedProductsCount
);

/**
 * @route   GET /api/products/admin
 * @desc    Lấy danh sách sản phẩm (Admin)
 * @access  Private (Admin)
 */
router.get("/admin", requireAuth, requireRole("admin"), getAllProducts);

/**
 * @route   GET /api/products/admin/:id
 * @desc    Lấy chi tiết sản phẩm theo ID (Admin)
 * @access  Private (Admin)
 */
router.get("/admin/:id", requireAuth, requireRole("admin"), getProductById);

/**
 * @route   POST /api/products/admin
 * @desc    Tạo sản phẩm mới (Admin)
 * @access  Private (Admin)
 */
router.post("/admin", requireAuth, requireRole("admin"), createProduct);

/**
 * @route   PUT /api/products/admin/:id
 * @desc    Cập nhật sản phẩm (Admin)
 * @access  Private (Admin)
 */
router.put("/admin/:id", requireAuth, requireRole("admin"), updateProduct);

/**
 * @route   PATCH /api/products/admin/:id/status
 * @desc    Cập nhật trạng thái sản phẩm (Admin)
 * @access  Private (Admin)
 */
router.patch(
  "/admin/:id/status",
  requireAuth,
  requireRole("admin"),
  updateProductStatus
);

/**
 * @route   DELETE /api/products/admin/:id
 * @desc    Xóa sản phẩm (Admin)
 * @access  Private (Admin)
 */
router.delete("/admin/:id", requireAuth, requireRole("admin"), deleteProduct);

// ===============================
// 🔹 PUBLIC ROUTES
// ===============================

/**
 * @route   GET /api/products/best-sell
 * @desc    Lấy top 10 sản phẩm bán chạy
 * @access  Public
 */
router.get("/best-sell", async (req, res) => {
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
});

/**
 * @route   GET /api/products/by-theme/:themeId
 * @desc    Lấy sản phẩm theo chủ đề (theme)
 * @access  Public
 */
router.get("/by-theme/:themeId", getProductsByTheme);

/**
 * @route   GET /api/products/by-character/:characterId
 * @desc    Lấy sản phẩm theo nhân vật
 * @access  Public
 */
router.get("/by-character/:characterId", getProductsByCharacter);

/**
 * @route   GET /api/products/category_list/:id
 * @desc    Lấy sản phẩm theo danh mục
 * @access  Public
 */
router.get("/category_list/:id", getProductByCategoryID);

/**
 * @route   GET /api/products/filters/meta
 * @desc    Lấy danh sách bộ lọc theme/age/difficulty
 * @access  Public
 */
router.get("/filters/meta", async (req, res) => {
  try {
    const themes = await Theme.find().select("_id name");
    const ageRanges = await AgeRange.find().select(
      "_id rangeLabel minAge maxAge"
    );
    const difficulties = await Difficulty.find().select("_id label level");

    res.json({
      success: true,
      data: { themes, ageRanges, difficulties },
    });
  } catch (error) {
    console.error("Get filter meta error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu lọc",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/recentlyViewedIds/view/recent
 * @desc    Lấy danh sách sản phẩm người dùng xem gần đây
 * @access  Public
 */
router.get("/recentlyViewedIds/view/recent", getRecentlyViewedProducts);

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (có search + filter + sort)
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      theme,
      category,
      minPrice,
      maxPrice,
      minPieces,
      maxPieces,
      ageRange,
      difficulty,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (theme) filter.themeId = theme;
    if (category) filter.categories = category;
    if (ageRange) filter.ageRangeId = ageRange;
    if (difficulty) filter.difficultyId = difficulty;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minPieces || maxPieces) {
      filter.pieces = {};
      if (minPieces) filter.pieces.$gte = Number(minPieces);
      if (maxPieces) filter.pieces.$lte = Number(maxPieces);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Lego.find(filter)
      .populate("themeId", "name")
      .populate("ageRangeId", "rangeLabel minAge maxAge")
      .populate("difficultyId", "label level")
      .populate("categories", "name slug")
      .populate("createdBy", "username email")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Lego.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết sản phẩm (Public)
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
