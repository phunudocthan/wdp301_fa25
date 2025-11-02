const Theme = require("../models/Theme");
const ThemeCharacter = require("../models/ThemeCharacter");
const Lego = require("../models/Lego");
const mongoose = require("mongoose");
const {
  uploadThemeBanner,
  uploadThemeCharacter,
} = require("../utils/multerThemeConfig");

// ==============================
// THEME CONTROLLERS
// ==============================

// Get all themes with pagination, search, and sorting
const getThemes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive,
      isPublished,
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

    // Published filter
    if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const themes = await Theme.find(query)
      .populate("createdBy", "username email")
      .populate("characters")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Theme.countDocuments(query);

    res.json({
      data: themes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching themes:", error);
    res.status(500).json({ error: "Failed to fetch themes" });
  }
};

// Get single theme by ID
const getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("characters");

    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    res.json({ data: theme });
  } catch (error) {
    console.error("Error fetching theme:", error);
    res.status(500).json({ error: "Failed to fetch theme" });
  }
};

// Get all active and published themes (for public view)
const getActiveThemes = async (req, res) => {
  try {
    // For user view, only require isActive (isPublished can be optional)
    const themes = await Theme.find({ isActive: true })
      .populate("characters")
      .sort({ createdAt: -1 });

    res.json({ data: themes });
  } catch (error) {
    console.error("Error fetching active themes:", error);
    res.status(500).json({ error: "Failed to fetch active themes" });
  }
};

// Create new theme
const createTheme = async (req, res) => {
  try {
    const { name, description, layout, isActive } = req.body;
    const banner = req.file
      ? `/uploads/themes/banners/${req.file.filename}`
      : null;

    // Check if theme name already exists
    const existingTheme = await Theme.findOne({ name: name.trim() });
    if (existingTheme) {
      return res.status(400).json({ error: "Theme name already exists" });
    }

    const theme = new Theme({
      name: name.trim(),
      description: description?.trim(),
      banner,
      layout: layout || "classic",
      isActive: isActive === "true" || isActive === true || false,
      createdBy: req.user.id,
    });

    const savedTheme = await theme.save();
    const populatedTheme = await Theme.findById(savedTheme._id)
      .populate("createdBy", "username email")
      .populate("characters");

    res.status(201).json({
      message: "Theme created successfully",
      data: populatedTheme,
    });
  } catch (error) {
    console.error("Error creating theme:", error);
    res.status(500).json({ error: "Failed to create theme" });
  }
};

// Update theme
const updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, layout, isActive, isPublished } = req.body;
    const banner = req.file
      ? `/uploads/themes/banners/${req.file.filename}`
      : undefined;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid theme ID format" });
    }

    const theme = await Theme.findById(id);
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // Check for duplicate name
    if (name && name.trim() !== theme.name) {
      const existingTheme = await Theme.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existingTheme) {
        return res.status(400).json({ error: "Theme name already exists" });
      }
    }

    // Update fields
    if (name) theme.name = name.trim();
    if (description !== undefined) theme.description = description.trim();
    if (layout) theme.layout = layout;

    // Parse isActive from string to boolean
    if (isActive !== undefined) {
      theme.isActive = isActive === "true" || isActive === true;
    }

    // Parse isPublished from string to boolean
    if (isPublished !== undefined) {
      theme.isPublished = isPublished === "true" || isPublished === true;
    }

    if (banner) theme.banner = banner;

    const updatedTheme = await theme.save();
    const populatedTheme = await Theme.findById(updatedTheme._id)
      .populate("createdBy", "username email")
      .populate("characters");

    res.json({
      message: "Theme updated successfully",
      data: populatedTheme,
    });
  } catch (error) {
    console.error("Error updating theme:", error);
    res.status(500).json({
      error: "Failed to update theme",
      details: error.message,
    });
  }
};

// Delete theme
const deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;

    const theme = await Theme.findById(id);
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // Check if theme has characters
    const charactersCount = await ThemeCharacter.countDocuments({
      themeId: id,
    });
    if (charactersCount > 0) {
      return res.status(400).json({
        error: `Cannot delete theme. It has ${charactersCount} character(s). Please delete characters first.`,
      });
    }

    await Theme.findByIdAndDelete(id);

    res.json({ message: "Theme deleted successfully" });
  } catch (error) {
    console.error("Error deleting theme:", error);
    res.status(500).json({ error: "Failed to delete theme" });
  }
};

// Get theme statistics
const getThemeStats = async (req, res) => {
  try {
    const totalThemes = await Theme.countDocuments();
    const activeThemes = await Theme.countDocuments({ isActive: true });
    const publishedThemes = await Theme.countDocuments({ isPublished: true });
    const totalCharacters = await ThemeCharacter.countDocuments();

    res.json({
      data: {
        totalThemes,
        activeThemes,
        publishedThemes,
        totalCharacters,
      },
    });
  } catch (error) {
    console.error("Error fetching theme stats:", error);
    res.status(500).json({ error: "Failed to fetch theme stats" });
  }
};

// ==============================
// THEME CHARACTER CONTROLLERS
// ==============================

// Get all theme characters with pagination, search, and sorting
const getThemeCharacters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      themeId,
      isActive,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (themeId) {
      query.themeId = themeId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const characters = await ThemeCharacter.find(query)
      .populate("createdBy", "username email")
      .populate("themeId", "name description")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ThemeCharacter.countDocuments(query);

    res.json({
      data: characters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching theme characters:", error);
    res.status(500).json({ error: "Failed to fetch theme characters" });
  }
};

// Get single theme character by ID
const getThemeCharacterById = async (req, res) => {
  try {
    const character = await ThemeCharacter.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("themeId", "name description");

    if (!character) {
      return res.status(404).json({ error: "Theme character not found" });
    }

    res.json({ data: character });
  } catch (error) {
    console.error("Error fetching theme character:", error);
    res.status(500).json({ error: "Failed to fetch theme character" });
  }
};

// Create new theme character
const createThemeCharacter = async (req, res) => {
  try {
    const { name, themeId, description, isActive, order } = req.body;
    const image = req.file
      ? `/uploads/themes/characters/${req.file.filename}`
      : null;

    if (!image) {
      return res.status(400).json({ error: "Character image is required" });
    }

    const theme = await Theme.findById(themeId);
    if (!theme) {
      return res.status(400).json({ error: "Theme not found" });
    }

    const character = new ThemeCharacter({
      name: name.trim(),
      image,
      themeId,
      description: description?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: req.user.id,
    });

    const savedCharacter = await character.save();
    const populatedCharacter = await ThemeCharacter.findById(savedCharacter._id)
      .populate("createdBy", "username email")
      .populate("themeId", "name description");

    res.status(201).json({
      message: "Theme character created successfully",
      data: populatedCharacter,
    });
  } catch (error) {
    console.error("Error creating theme character:", error);
    res.status(500).json({ error: "Failed to create theme character" });
  }
};

// Update theme character
const updateThemeCharacter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, themeId, description, isActive, order } = req.body;
    const image = req.file
      ? `/uploads/themes/characters/${req.file.filename}`
      : undefined;

    const character = await ThemeCharacter.findById(id);
    if (!character) {
      return res.status(404).json({ error: "Theme character not found" });
    }

    if (themeId && themeId !== character.themeId.toString()) {
      const theme = await Theme.findById(themeId);
      if (!theme) {
        return res.status(400).json({ error: "Theme not found" });
      }
    }

    if (name) character.name = name.trim();
    if (themeId) character.themeId = themeId;
    if (description !== undefined) character.description = description.trim();
    if (isActive !== undefined) character.isActive = isActive;
    if (order !== undefined) character.order = order;
    if (image) character.image = image;

    const updatedCharacter = await character.save();
    const populatedCharacter = await ThemeCharacter.findById(
      updatedCharacter._id
    )
      .populate("createdBy", "username email")
      .populate("themeId", "name description");

    res.json({
      message: "Theme character updated successfully",
      data: populatedCharacter,
    });
  } catch (error) {
    console.error("Error updating theme character:", error);
    res.status(500).json({ error: "Failed to update theme character" });
  }
};

// Delete theme character
const deleteThemeCharacter = async (req, res) => {
  try {
    const { id } = req.params;

    const character = await ThemeCharacter.findById(id);
    if (!character) {
      return res.status(404).json({ error: "Theme character not found" });
    }

    await ThemeCharacter.findByIdAndDelete(id);

    res.json({ message: "Theme character deleted successfully" });
  } catch (error) {
    console.error("Error deleting theme character:", error);
    res.status(500).json({ error: "Failed to delete theme character" });
  }
};

// Toggle theme active status
const toggleThemeActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid theme ID format" });
    }

    const theme = await Theme.findById(id);

    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    theme.isActive = !theme.isActive;
    await theme.save();

    res.json({
      message: "Theme status updated successfully",
      data: { isActive: theme.isActive },
    });
  } catch (error) {
    console.error("Error toggling theme status:", error);
    res.status(500).json({
      error: "Failed to toggle theme status",
      details: error.message,
    });
  }
};

module.exports = {
  // Theme exports
  getThemes,
  getThemeById,
  getActiveThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  getThemeStats,
  toggleThemeActive,
  // Theme Character exports
  getThemeCharacters,
  getThemeCharacterById,
  createThemeCharacter,
  updateThemeCharacter,
  deleteThemeCharacter,
  // Multer exports
  uploadThemeBanner,
  uploadThemeCharacter,
};
