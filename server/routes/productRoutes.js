const express = require("express");
const Lego = require("../models/Lego");

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

module.exports = router;
