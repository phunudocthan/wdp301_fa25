const express = require("express");
const router = express.Router();
const uploadProduct = require("../utils/multerProductConfig");
const { requireAuth } = require("../middleware/authMiddleware");

/**
 * @desc    Upload product images
 * @route   POST /api/upload/product-images
 * @access  Private (Admin)
 */
router.post(
  "/product-images",
  requireAuth,
  uploadProduct.array("images", 5),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có file nào được upload",
        });
      }

      // Tạo URLs cho các file đã upload
      const imageUrls = req.files.map((file) => {
        return `${req.protocol}://${req.get("host")}/uploads/products/${
          file.filename
        }`;
      });

      res.json({
        success: true,
        message: "Upload ảnh thành công",
        data: {
          images: imageUrls,
        },
      });
    } catch (error) {
      console.error("Upload product images error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi upload ảnh",
        error: error.message,
      });
    }
  }
);

/**
 * @desc    Upload single product image
 * @route   POST /api/upload/product-image
 * @access  Private (Admin)
 */
router.post(
  "/product-image",
  requireAuth,
  uploadProduct.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file nào được upload",
        });
      }

      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${
        req.file.filename
      }`;

      res.json({
        success: true,
        message: "Upload ảnh thành công",
        data: {
          image: imageUrl,
        },
      });
    } catch (error) {
      console.error("Upload product image error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi upload ảnh",
        error: error.message,
      });
    }
  }
);

module.exports = router;
