const Lego = require("../models/Lego");
const Theme = require("../models/Theme");
const AgeRange = require("../models/AgeRange");
const Difficulty = require("../models/Difficulty");
const ThemeCharacter = require("../models/ThemeCharacter");

/**
 * @desc Lấy danh sách tất cả sản phẩm (Admin)
 * @route GET /api/admin/products
 * @access Private (Admin)
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

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (theme) filter.themeId = theme;
    if (category) filter.categories = category;
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Lego.find(filter)
      .populate("themeId", "name")
      .populate("characterId", "name description order")
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
 * @desc Lấy thông tin chi tiết sản phẩm theo ID
 * @route GET /api/admin/products/:id
 * @access Private (Admin)
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Lego.findById(id)
      .populate("themeId", "name")
      .populate("characterId", "name description order")
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

    res.json({ success: true, data: product });
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
 * @desc Tạo sản phẩm mới
 * @route POST /api/admin/products
 * @access Private (Admin)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      themeId,
      // characterId,
      ageRangeId,
      difficultyId,
      pieces,
      price,
      stock,
      status = "active",
      images = [],
      categories = [],
    } = req.body;

    if (!name || !themeId || !ageRangeId || !difficultyId || !price) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

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

    // if (characterId) {
    //   const character = await ThemeCharacter.findById(characterId);
    //   if (!character) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Nhân vật không hợp lệ",
    //     });
    //   }
    // }

    const existingProduct = await Lego.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm đã tồn tại",
      });
    }

    let cleanCategories = [];
    if (Array.isArray(categories)) {
      cleanCategories = categories.filter(
        (cat) => cat && cat.trim() !== "" && cat.length === 24
      );
    }

    const newProduct = new Lego({
      name: name.trim(),
      themeId,
      // characterId,
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
      // .populate("characterId", "name")
      .populate("ageRangeId", "rangeLabel")
      .populate("difficultyId", "label")
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
 * @desc Cập nhật sản phẩm
 * @route PUT /api/admin/products/:id
 * @access Private (Admin)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingProduct = await Lego.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

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

    if (updateData.themeId) {
      const theme = await Theme.findById(updateData.themeId);
      if (!theme) {
        return res.status(400).json({
          success: false,
          message: "Theme không hợp lệ",
        });
      }
    }

    if (updateData.characterId) {
      const char = await ThemeCharacter.findById(updateData.characterId);
      if (!char) {
        return res.status(400).json({
          success: false,
          message: "Nhân vật không hợp lệ",
        });
      }
    }

    const updatedProduct = await Lego.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("themeId", "name")
      .populate("characterId", "name description order")
      .populate("ageRangeId", "rangeLabel")
      .populate("difficultyId", "label")
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
 * @desc Xóa sản phẩm
 * @route DELETE /api/admin/products/:id
 * @access Private (Admin)
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
 * @desc Lấy sản phẩm theo themeId
 * @route GET /api/products/by-theme/:themeId
 */
const getProductsByTheme = async (req, res) => {
  try {
    const { themeId } = req.params;
    const products = await Lego.find({ themeId })
      .populate("themeId", "name")
      .populate("characterId", "name description")
      .populate("price images");

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Lấy sản phẩm theo characterId
 * @route GET /api/products/by-character/:characterId
 */
const getProductsByCharacter = async (req, res) => {
  try {
    const { characterId } = req.params;
    const products = await Lego.find({ characterId })
      .populate("themeId", "name")
      .populate("characterId", "name description")
      .populate("price images");

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Cập nhật trạng thái sản phẩm
 * @route PUT /api/admin/products/:id/status
 * @access Private (Admin)
 */
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive, pending",
      });
    }

    const product = await Lego.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("themeId", "name")
      .populate("characterId", "name")
      .populate("categories", "name")
      .populate("createdBy", "username");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm cần cập nhật trạng thái",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    console.error("Update product status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái sản phẩm",
      error: error.message,
    });
  }
};

/**
 * @desc Lấy số lượng sản phẩm chưa phân loại
 * @route GET /api/admin/products/uncategorized/count
 * @access Private (Admin)
 */
const getUncategorizedProductsCount = async (req, res) => {
  try {
    const uncategorizedCount = await Lego.countDocuments({
      $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }],
    });

    res.json({
      success: true,
      data: { uncategorizedCount },
    });
  } catch (error) {
    console.error("Get uncategorized products count error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy số lượng sản phẩm chưa phân loại",
      error: error.message,
    });
  }
};

/**
 * @desc Lấy danh sách sản phẩm theo Category ID
 * @route GET /api/products/by-category/:id
 */
const getProductByCategoryID = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Lego.find({ categories: id })
      .populate("themeId", "name")
      .populate("characterId", "name description")
      .populate("ageRangeId", "rangeLabel minAge maxAge")
      .populate("difficultyId", "label level")
      .populate("categories", "name slug")
      .populate("createdBy", "username email");

    res.json({
      success: true,
      data: products,
      message:
        products.length === 0
          ? "Không có sản phẩm nào trong danh mục này."
          : undefined,
    });
  } catch (error) {
    console.error("Get products by category ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm theo danh mục",
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
 * @desc Lấy danh sách sản phẩm đã xem gần đây
 * @route POST /api/products/recently-viewed
 * @access Private (User)
 */
const getRecentlyViewedProducts = async (req, res) => {
  try {
    const { id } = req.body; // mảng productId được FE gửi lên

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách sản phẩm đã xem không hợp lệ",
      });
    }

    const products = await Lego.find({ _id: { $in: ids } })
      .populate("themeId", "name")
      .populate("characterId", "name")
      .populate("categories", "name slug");

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get recently viewed products error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm đã xem gần đây",
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
  getUncategorizedProductsCount,
  getProductByCategoryID,
  getRecentlyViewedProducts,
  getProductsByTheme,
  getProductsByCharacter,
  getProductStats,
};
