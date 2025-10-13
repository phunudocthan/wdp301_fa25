const multer = require("multer");
const path = require("path");
const fs = require("fs");
const rootDir = path.join(__dirname, "..");

// Đảm bảo thư mục products tồn tại
const uploadDir = path.join(rootDir, "uploads", "products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return cb(new Error("Only images are allowed (jpg, jpeg, png, webp)"));
  }

  // Kiểm tra size file (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error("File size should not exceed 5MB"));
  }

  cb(null, true);
};

const uploadProduct = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadProduct;
