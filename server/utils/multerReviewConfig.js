const multer = require("multer");
const path = require("path");
const fs = require("fs");
const rootDir = path.join(__dirname, "..");

// Ensure reviews upload folder exists
const uploadDir = path.join(rootDir, "uploads", "reviews");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "review-" + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return cb(new Error("Only images are allowed (jpg, jpeg, png, webp)"));
  }
  cb(null, true);
};

const uploadReview = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadReview;
