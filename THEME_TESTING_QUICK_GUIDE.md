# 🎨 Theme Management - Quick Test Guide

## ✅ Backend đã sẵn sàng

### API Endpoints:

```
GET    /api/themes                  - Danh sách themes (admin/employee)
GET    /api/themes/active           - Themes đang active (public)
GET    /api/themes/stats            - Thống kê themes
GET    /api/themes/:id              - Chi tiết theme
POST   /api/themes                  - Tạo theme mới
PUT    /api/themes/:id              - Cập nhật theme
DELETE /api/themes/:id              - Xóa theme
PATCH  /api/themes/:id/toggle-active      - Bật/tắt active

GET    /api/themes/:themeId/characters    - Danh sách characters
POST   /api/themes/:themeId/characters    - Tạo character
PUT    /api/themes/characters/:id         - Cập nhật character
DELETE /api/themes/characters/:id         - Xóa character
```

## 🚀 Cách test

### 1. Start Backend

```bash
cd server
npm start
```

### 2. Start Frontend

```bash
cd client
npm run dev
```

### 3. Truy cập giao diện

1. Đăng nhập với tài khoản admin/employee
2. Vào menu: **Admin Dashboard** → **Themes**
3. URL: `http://localhost:3000/admin/themes`

## 🎯 Test Cases

### ✅ Test 1: Xem danh sách themes

- Vào `/admin/themes`
- Kiểm tra hiển thị table với columns: Banner, Tên, Mô tả, Layout, Status
- Kiểm tra stats cards: Tổng themes, Active

### ✅ Test 2: Tạo theme mới

1. Click button **"Thêm Theme"**
2. Điền thông tin:
   - Tên theme: "Ninjago Dark Theme"
   - Mô tả: "Dark ninja theme with red accents"
   - Layout: Modern
   - Upload banner (optional)
   - Chọn màu sắc (5 colors)
   - Check "Kích hoạt theme"
3. Click **"Tạo mới"**
4. Kiểm tra theme xuất hiện trong danh sách

### ✅ Test 3: Chỉnh sửa theme

1. Click icon **Edit** (bút chì) ở theme bất kỳ
2. Thay đổi:
   - Tên hoặc mô tả
   - Upload banner mới
   - Thay đổi màu sắc
3. Click **"Cập nhật"**
4. Kiểm tra thay đổi được áp dụng

### ✅ Test 4: Toggle Active status

1. Click badge **"Active"** hoặc **"Inactive"**
2. Kiểm tra status thay đổi ngay lập tức
3. Badge đổi màu: xanh (Active) / đỏ (Inactive)

### ✅ Test 5: Xóa theme

1. Click icon **Delete** (thùng rác)
2. Confirm dialog xuất hiện
3. Click OK
4. Kiểm tra theme bị xóa khỏi danh sách

**Lưu ý:** Không thể xóa theme nếu:

- Theme có characters

### ✅ Test 6: Tìm kiếm theme

1. Nhập từ khóa vào search box (ví dụ: "ninja")
2. Kết quả lọc tự động
3. Xóa search → hiển thị tất cả

### ✅ Test 7: Lọc theo status

1. Chọn "Đang hoạt động" → chỉ hiển thị active themes
2. Chọn "Không hoạt động" → chỉ hiển thị inactive themes
3. Chọn "Tất cả trạng thái" → hiển thị tất cả

### ✅ Test 8: Phân trang

1. Nếu có > 10 themes
2. Kiểm tra buttons "Trước"/"Sau"
3. Kiểm tra hiển thị "Trang X / Y"

### ✅ Test 9: Upload banner

1. Tạo/Edit theme
2. Click vùng upload banner
3. Chọn ảnh (JPEG/PNG/GIF/WebP, max 10MB)
4. Preview hiển thị ngay
5. Click "Xóa" để remove banner
6. Save theme và kiểm tra banner hiển thị trong table

## 🎨 Kiểm tra giao diện

### Desktop (1920x1080)

- [ ] Table hiển thị đầy đủ columns
- [ ] Stats cards hiển thị 2 cột
- [ ] Modal form không bị cắt
- [ ] Color picker hoạt động tốt

### Tablet (768px)

- [ ] Table scroll ngang
- [ ] Stats cards hiển thị 1-2 cột
- [ ] Modal responsive

### Mobile (375px)

- [ ] Filters stack vertically
- [ ] Stats cards 1 cột
- [ ] Modal full screen
- [ ] Table scroll ngang

## 🐛 Common Issues & Solutions

### Issue 1: "Authentication required"

**Solution:** Login lại hoặc check token trong localStorage

### Issue 2: "Cannot read property 'data'"

**Solution:** Check API response structure, phải có `data` và `pagination`

### Issue 3: Banner không hiển thị

**Solution:**

- Check đường dẫn: `/uploads/themes/banners/`
- Verify file được upload thành công
- Check `getFullImageURL()` function

### Issue 4: Không thể xóa theme

**Solution:**

- Xóa hết characters của theme trước

### Issue 5: Color picker không hoạt động

**Solution:**

- Check browser support `<input type="color">`
- Hoặc nhập hex code thủ công

## 📊 Data Structure

### Theme Object:

```typescript
{
  _id: string;
  name: string;
  description: string;
  banner: string; // "/uploads/themes/banners/xxx.jpg"
  colors: {
    primary: "#1E40AF";
    secondary: "#7C3AED";
    background: "#FFFFFF";
    text: "#1F2937";
    accent: "#F59E0B";
  }
  layout: "classic" | "modern" | "minimal" | "creative";
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## ✨ Features Summary

✅ **Đã có đầy đủ:**

- CRUD theme (Create, Read, Update, Delete)
- Upload banner với preview
- Color picker (5 màu)
- Toggle active status
- Search themes
- Filter by status
- Pagination
- Stats dashboard
- Responsive design
- Error handling
- Success notifications

✅ **API đã hoàn chỉnh:**

- Authentication & Authorization (admin/employee only)
- Input validation
- File upload (multer)
- Database queries với indexes
- Error handling
- Response format chuẩn

## 🎯 Next Steps (Optional)

Nếu cần mở rộng:

1. **Theme Characters Management** - Trang riêng quản lý characters
2. **Theme Preview** - Preview theme trên frontend
3. **Theme Duplication** - Copy theme hiện có
4. **Theme Export/Import** - JSON format
5. **Theme History** - Track changes
6. **Bulk Actions** - Select multiple và xóa/activate hàng loạt
7. **Theme Filter cho Products** - Lọc sản phẩm theo theme

## 📝 Notes

- File uploads lưu ở: `server/uploads/themes/banners/`
- Max banner size: 10MB
- Chỉ admin và employee có quyền truy cập
- Theme có characters không thể xóa
- Theme hoạt động như danh mục - hiển thị trên FE để người dùng click vào xem

---

**Status:** ✅ READY FOR TESTING

Mọi thứ đã sẵn sàng! Bắt đầu test ngay! 🚀
