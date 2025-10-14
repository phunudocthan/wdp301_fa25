const Lego = require("../models/Lego");
const Theme = require("../models/Theme");
const AgeRange = require("../models/AgeRange");
const Difficulty = require("../models/Difficulty");

/**
 * @desc    Lấy danh sách tất cả sản phẩm (Admin)
 * @route   GET /api/admin/products
 * @access  Private (Admin)
 */
/**
 * @desc    Lấy danh sách tất cả sản phẩm (Admin)
 * @route   GET /api/admin/products
 * @access  Private (Admin)
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      theme,
      status,
      category,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (theme) {
      filter.themeId = theme;
    }

    if (category) {
      filter.categories = category;
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
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
};



/**
 * @desc    Lấy thông tin một sản phẩm theo ID
 * @route   GET /api/admin/products/:id
 * @access  Private (Admin)
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Lego.findById(id)
      .populate("themeId", "name")
      .populate("ageRangeId", "rangeLabel minAge maxAge")
      .populate("difficultyId", "label level")
      .populate("categories", "name slug")
      .populate("createdBy", "username email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin sản phẩm",
      error: error.message,
    });
  }
};

/**
 * @desc    Tạo sản phẩm mới
 * @route   POST /api/admin/products
 * @access  Private (Admin)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      themeId,
      ageRangeId,
      difficultyId,
      pieces,
      price,
      stock,
      status = "active",
      images = [],
      categories = [],
    } = req.body;

    // Validate required fields
    if (!name || !themeId || !ageRangeId || !difficultyId || !price) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // Validate references exist
    const [theme, ageRange, difficulty] = await Promise.all([
      Theme.findById(themeId),
      AgeRange.findById(ageRangeId),
      Difficulty.findById(difficultyId),
    ]);

    if (!theme || !ageRange || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Thông tin theme, độ tuổi hoặc độ khó không hợp lệ",
      });
    }

    // Check if product name already exists
    const existingProduct = await Lego.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm đã tồn tại",
      });
    }

    // Clean categories data
    let cleanCategories = [];
    if (categories) {
      if (typeof categories === "string") {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(categories);
          cleanCategories = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // If parsing fails, treat as empty array
          cleanCategories = [];
        }
      } else if (Array.isArray(categories)) {
        cleanCategories = categories;
      }

      // Filter out empty strings and invalid ObjectIds
      cleanCategories = cleanCategories
        .filter((cat) => cat && cat.trim() !== "" && cat.length === 24)
        .map((cat) => cat.trim());
    }

    const newProduct = new Lego({
      name: name.trim(),
      themeId,
      ageRangeId,
      difficultyId,
      pieces: pieces || 0,
      price,
      stock: stock || 0,
      status,
      images,
      categories: cleanCategories,
      createdBy: req.user.id,
    });

    const savedProduct = await newProduct.save();
    const populatedProduct = await Lego.findById(savedProduct._id)
      .populate("themeId", "name")
      .populate("ageRangeId", "name")
      .populate("difficultyId", "name")
      .populate("categories", "name slug")
      .populate("createdBy", "username email");

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo sản phẩm",
      error: error.message,
    });
  }
};

/**
 * @desc    Cập nhật sản phẩm
 * @route   PUT /api/admin/products/:id
 * @access  Private (Admin)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("Update product data received:", updateData);
    console.log(
      "Categories data:",
      updateData.categories,
      typeof updateData.categories
    );

    // Check if product exists
    const existingProduct = await Lego.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== existingProduct.name) {
      const nameExists = await Lego.findOne({
        name: updateData.name.trim(),
        _id: { $ne: id },
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: "Tên sản phẩm đã tồn tại",
        });
      }
    }

    // Validate references if they're being updated
    if (
      updateData.themeId ||
      updateData.ageRangeId ||
      updateData.difficultyId
    ) {
      const validationPromises = [];

      if (updateData.themeId) {
        validationPromises.push(Theme.findById(updateData.themeId));
      }
      if (updateData.ageRangeId) {
        validationPromises.push(AgeRange.findById(updateData.ageRangeId));
      }
      if (updateData.difficultyId) {
        validationPromises.push(Difficulty.findById(updateData.difficultyId));
      }

      const results = await Promise.all(validationPromises);
      if (results.some((result) => !result)) {
        return res.status(400).json({
          success: false,
          message: "Thông tin theme, độ tuổi hoặc độ khó không hợp lệ",
        });
      }
    }

    // Clean categories data
    if (updateData.categories) {
      // Handle case where categories might be a string or array with empty strings
      let cleanCategories = [];

      if (typeof updateData.categories === "string") {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(updateData.categories);
          cleanCategories = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // If parsing fails, treat as empty array
          cleanCategories = [];
        }
      } else if (Array.isArray(updateData.categories)) {
        cleanCategories = updateData.categories;
      }

      // Filter out empty strings and invalid ObjectIds
      updateData.categories = cleanCategories
        .filter((cat) => cat && cat.trim() !== "" && cat.length === 24)
        .map((cat) => cat.trim());

      console.log("Cleaned categories:", updateData.categories);
    }

    // Update product
    const updatedProduct = await Lego.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("themeId", "name")
      .populate("ageRangeId", "name")
      .populate("difficultyId", "name")
      .populate("categories", "name slug")
      .populate("createdBy", "username email");

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

/**
 * @desc    Xóa sản phẩm
 * @route   DELETE /api/admin/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Lego.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    await Lego.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa sản phẩm",
      error: error.message,
    });
  }
};

/**
 * @desc    Cập nhật trạng thái sản phẩm
 * @route   PATCH /api/admin/products/:id/status
 * @access  Private (Admin)
 */
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const product = await Lego.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: { id, status },
    });
  } catch (error) {
    console.error("Update product status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy thống kê sản phẩm
 * @route   GET /api/admin/products/stats
 * @access  Private (Admin)
 */
const getProductStats = async (req, res) => {
  try {
    const [totalProducts, activeProducts, inactiveProducts, lowStockProducts] =
      await Promise.all([
        Lego.countDocuments(),
        Lego.countDocuments({ status: "active" }),
        Lego.countDocuments({ status: "inactive" }),
        Lego.countDocuments({ stock: { $lt: 10 } }),
      ]);

    res.json({
      success: true,
      data: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        lowStock: lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy số lượng sản phẩm chưa phân loại
 * @route   GET /api/admin/products/uncategorized/count
 * @access  Private (Admin)
 */
const getUncategorizedProductsCount = async (req, res) => {
  try {
    const uncategorizedCount = await Lego.countDocuments({
      $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }],
    });

    res.json({
      success: true,
      data: {
        uncategorizedCount,
      },
    });
  } catch (error) {
    console.error("Get uncategorized products count error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy số lượng sản phẩm chưa phân loại",
      error: error.message,
    });
  }
};const getProductByCategoryID = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Lego.find({ categories: id })
      .populate("themeId", "name")
      .populate("ageRangeId", "rangeLabel minAge maxAge")
      .populate("difficultyId", "label level")
      .populate("categories", "name slug")
      .populate("createdBy", "username email");

    res.json({
      success: true,
      data: products, // empty array if none
      message: products.length === 0 ? "No products found in this category." : undefined,
    });
  } catch (error) {
    console.error("Get products by category ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error when fetching products by category",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductStats,
  getProductByCategoryID,
  getUncategorizedProductsCount,
};
