const express = require("express");
const router = express.Router();
const themeController = require("../controllers/themeController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// ============= PUBLIC ROUTES =============
// Lấy danh sách theme đang hoạt động (hiển thị cho người dùng)
router.get("/active", themeController.getActiveThemes);

// Lấy chi tiết 1 nhân vật (public)
router.get("/characters/:id", themeController.getThemeCharacterById);

// ============= THEME MANAGEMENT (ADMIN/EMPLOYEE) =============
// Lấy tất cả theme (tìm kiếm, sắp xếp, phân trang)
router.get(
  "/",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.getThemes
);

// Lấy thống kê theme (ví dụ: số sản phẩm/nhân vật mỗi theme)
router.get(
  "/stats",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.getThemeStats
);

// Lấy chi tiết 1 theme (works for both public and admin)
router.get("/:id", themeController.getThemeById);

// Thêm theme mới
router.post(
  "/",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.uploadThemeBanner.single("banner"),
  themeController.createTheme
);

// Cập nhật theme
router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.uploadThemeBanner.single("banner"),
  themeController.updateTheme
);

// Xóa theme
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.deleteTheme
);

// Toggle active status
router.patch(
  "/:id/toggle-active",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.toggleThemeActive
);

// ============= THEME CHARACTERS (ADMIN/EMPLOYEE) =============
// Lấy danh sách nhân vật theo theme
router.get(
  "/:themeId/characters",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.getThemeCharacters
);

// Thêm nhân vật vào theme
router.post(
  "/:themeId/characters",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.uploadThemeCharacter.single("image"),
  themeController.createThemeCharacter
);

// Cập nhật nhân vật
router.put(
  "/characters/:id",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.uploadThemeCharacter.single("image"),
  themeController.updateThemeCharacter
);

// Xóa nhân vật
router.delete(
  "/characters/:id",
  requireAuth,
  requireRole("admin", "employee"),
  themeController.deleteThemeCharacter
);

module.exports = router;
