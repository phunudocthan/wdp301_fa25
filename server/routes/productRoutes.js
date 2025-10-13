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
  getProductByCategoryID,
} = require("../controllers/productController");

const router = express.Router();
const Order = require("../models/Order");

// get product best sell
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

    // ✅ Chuẩn hóa format để FE dùng chung với /products
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

router.get("/best-sell", getBestSellProducts);
router.get("/caterory_list/:id", getProductByCategoryID);


/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (có hỗ trợ search + filter + sort)
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { search, theme, minPrice, maxPrice, status, sortBy } = req.query;

    let filter = {};

    // 🔍 Search theo ký tự (tên hoặc mô tả)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } }, // không phân biệt hoa thường
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

    // 📦 Query Mongo
    const products = await Lego.find(filter).sort(sort);

    return res.json({
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});
//detail
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
    return res.json(product);
  } catch (err) {
    console.error("❌ Error fetching product:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// ADMIN ROUTES - Quản lý sản phẩm
// ===============================

/**
 * @route   GET /api/products/admin/stats
 * @desc    Lấy thống kê sản phẩm (Admin)
 * @access  Private (Admin only)
 */
router.get("/admin/stats", requireAuth, requireRole("admin"), getProductStats);

/**
 * @route   GET /api/products/admin/uncategorized/count
 * @desc    Lấy số lượng sản phẩm chưa phân loại (Admin)
 * @access  Private (Admin only)
 */
router.get(
  "/admin/uncategorized/count",
  requireAuth,
  requireRole("admin"),
  getUncategorizedProductsCount
);

/**
 * @route   GET /api/products/admin
 * @desc    Lấy tất cả sản phẩm với phân trang (Admin)
 * @access  Private (Admin only)
 */
router.get("/admin", requireAuth, requireRole("admin"), getAllProducts);

/**
 * @route   GET /api/products/admin/:id
 * @desc    Lấy chi tiết sản phẩm theo ID (Admin)
 * @access  Private (Admin only)
 */
router.get("/admin/:id", requireAuth, requireRole("admin"), getProductById);

/**
 * @route   POST /api/products/admin
 * @desc    Tạo sản phẩm mới (Admin)
 * @access  Private (Admin only)
 */
router.post("/admin", requireAuth, requireRole("admin"), createProduct);

/**
 * @route   PUT /api/products/admin/:id
 * @desc    Cập nhật sản phẩm (Admin)
 * @access  Private (Admin only)
 */
router.put("/admin/:id", requireAuth, requireRole("admin"), updateProduct);

/**
 * @route   PATCH /api/products/admin/:id/status
 * @desc    Cập nhật trạng thái sản phẩm (Admin)
 * @access  Private (Admin only)
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
 * @access  Private (Admin only)
 */
router.delete("/admin/:id", requireAuth, requireRole("admin"), deleteProduct);

module.exports = router;
