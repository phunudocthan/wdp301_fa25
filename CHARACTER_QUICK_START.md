# 🎭 Character Management - Quick Start

## 📍 Truy Cập

```
URL: http://localhost:5173/admin/characters
Menu: Admin Header → "Characters"
```

## 🚀 Chức Năng Chính

### 1️⃣ Danh Sách Nhân Vật

- ✅ Xem tất cả nhân vật trong hệ thống
- ✅ Tìm kiếm theo tên/mô tả
- ✅ Lọc theo theme
- ✅ Phân trang (10 items/page)
- ✅ Thống kê tổng quan

### 2️⃣ Xem Chi Tiết

- ✅ Xem đầy đủ thông tin nhân vật
- ✅ Ảnh full size
- ✅ Thông tin theme liên kết
- ✅ Thời gian tạo/cập nhật

### 3️⃣ Tạo Mới Nhân Vật

**Trường bắt buộc:**

- 📷 Ảnh nhân vật
- 📝 Tên nhân vật
- 🎨 Theme

**Trường tùy chọn:**

- Mô tả
- Thứ tự hiển thị (default: 0)
- Trạng thái (default: active)

### 4️⃣ Xóa Nhân Vật

- ✅ Xóa với xác nhận
- ✅ Auto refresh sau khi xóa

## 📂 File Chính

```
client/src/pages/AdminCharacterManagement.tsx
```

## 🔌 API Endpoints

```typescript
GET    /api/themes                           // Lấy themes
GET    /api/themes/:themeId/characters       // Lấy characters theo theme
GET    /api/themes/characters/:id            // Chi tiết character
POST   /api/themes/:themeId/characters       // Tạo mới character
DELETE /api/themes/characters/:id            // Xóa character
```

## 💡 Tips

- Upload ảnh tỷ lệ 1:1 (500x500px khuyến nghị)
- Tên nhân vật nên ngắn gọn và rõ ràng
- Thứ tự càng nhỏ càng hiển thị trước
- Set inactive để chuẩn bị trước khi publish

## 📝 Quick Create Flow

1. Click "Tạo Nhân Vật Mới"
2. Upload ảnh → Nhập tên → Chọn theme
3. Điền mô tả (optional)
4. Click "Tạo Nhân Vật"
5. Done! ✅

---

📖 **Chi tiết**: Xem `CHARACTER_MANAGEMENT_GUIDE.md`
