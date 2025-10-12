const Category = require("../models/Category");
const Lego = require("../models/Lego");
const multer = require("multer");
const path = require("path");

// Multer configuration for category images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/categories/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "category-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Get all categories with pagination, search, and filtering
const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
      isActive,
      parentId,
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Active filter
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Parent filter
    if (parentId !== undefined) {
      query.parentId = parentId || null;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const categories = await Category.find(query)
      .populate("createdBy", "username email")
      .populate("parentId", "name")
      .populate("subcategories")
      .populate("productCount")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Category.countDocuments(query);

    res.json({
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("parentId", "name")
      .populate("subcategories")
      .populate("productCount");

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, isActive, order } = req.body;
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ error: "Category name already exists" });
    }

    // Validate parent category if provided
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({ error: "Parent category not found" });
      }
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      parentId: parentId || null,
      image,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: req.user.id,
    });

    const savedCategory = await category.save();
    const populatedCategory = await Category.findById(savedCategory._id)
      .populate("createdBy", "username email")
      .populate("parentId", "name");

    res.status(201).json({
      message: "Category created successfully",
      data: populatedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, isActive, order } = req.body;
    const image = req.file
      ? `/uploads/categories/${req.file.filename}`
      : undefined;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if name already exists (excluding current category)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existingCategory) {
        return res.status(400).json({ error: "Category name already exists" });
      }
    }

    // Validate parent category if provided
    if (parentId && parentId !== category.parentId?.toString()) {
      if (parentId === id) {
        return res
          .status(400)
          .json({ error: "Category cannot be parent of itself" });
      }

      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({ error: "Parent category not found" });
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (parentId !== undefined) category.parentId = parentId || null;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;
    if (image) category.image = image;

    const updatedCategory = await category.save();
    const populatedCategory = await Category.findById(updatedCategory._id)
      .populate("createdBy", "username email")
      .populate("parentId", "name");

    res.json({
      message: "Category updated successfully",
      data: populatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parentId: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete category that has subcategories. Please delete subcategories first.",
      });
    }

    // Check if category is assigned to any products
    const productsCount = await Lego.countDocuments({ categories: id });
    if (productsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category. It is assigned to ${productsCount} product(s). Please remove the category from products first.`,
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

// Toggle category status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.isActive = isActive;
    await category.save();

    res.json({
      message: "Category status updated successfully",
      data: { isActive: category.isActive },
    });
  } catch (error) {
    console.error("Error updating category status:", error);
    res.status(500).json({ error: "Failed to update category status" });
  }
};

// Get category tree (hierarchical structure)
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("subcategories")
      .sort({ order: 1, name: 1 });

    // Build tree structure
    const buildTree = (parentId = null) => {
      return categories
        .filter((cat) => String(cat.parentId) === String(parentId))
        .map((cat) => ({
          ...cat.toObject(),
          children: buildTree(cat._id),
        }));
    };

    const tree = buildTree();

    res.json({ data: tree });
  } catch (error) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({ error: "Failed to fetch category tree" });
  }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const parentCategories = await Category.countDocuments({ parentId: null });
    const subcategories = await Category.countDocuments({
      parentId: { $ne: null },
    });

    res.json({
      data: {
        totalCategories,
        activeCategories,
        parentCategories,
        subcategories,
      },
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({ error: "Failed to fetch category stats" });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryTree,
  getCategoryStats,
  upload,
};
