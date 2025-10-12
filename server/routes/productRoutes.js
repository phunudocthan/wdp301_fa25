const express = require("express");
const Lego = require("../models/Lego");

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (có hỗ trợ search + filter + sort)
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { search, theme, minPrice, maxPrice, status, sortBy } = req.query;

    let filter = {};

    // 🔍 Search theo text (name, description)
    if (search) {
      filter.$text = { $search: search };
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
