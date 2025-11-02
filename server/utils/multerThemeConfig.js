const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Theme banner storage configuration
const themeBannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/themes/banners";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Theme character storage configuration
const themeCharacterStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/themes/characters";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "character-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images
const imageFileFilter = function (req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed!"),
      false
    );
  }
};

// Theme banner upload
const uploadThemeBanner = multer({
  storage: themeBannerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFileFilter,
});

// Theme character upload
const uploadThemeCharacter = multer({
  storage: themeCharacterStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

module.exports = {
  uploadThemeBanner,
  uploadThemeCharacter,
};
