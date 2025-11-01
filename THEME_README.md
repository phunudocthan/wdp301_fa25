# 🎨 Theme Management System - Quick Start

Hệ thống quản lý Theme và Theme Character đã hoàn thành đầy đủ!

## ✅ Đã implement

### 9 chức năng chính (51-59):

1. ✅ **Theme - Create** - Tạo theme mới với colors, banner, layout
2. ✅ **Theme - Update/Delete** - Cập nhật/xóa theme
3. ✅ **Theme - Search/Sort** - Tìm kiếm, sắp xếp theme
4. ✅ **Theme - Apply** - Áp dụng theme cho website (publish/preview)
5. ✅ **Theme Character - Create** - Tạo character với image
6. ✅ **Theme Character - Update** - Cập nhật character
7. ✅ **Theme Character - Delete** - Xóa character
8. ✅ **Theme Character - View/List** - Danh sách và lọc characters
9. ✅ **Theme Character - Detail** - Chi tiết character

## 🚀 Quick Start

### 1. Start Server

```bash
cd server
npm start
```

### 2. Test API

```bash
# Automated test
node test-theme-api.js

# Or manual test với Postman/cURL - xem THEME_TESTING_GUIDE.md
```

## 📁 Files Created/Modified

### Backend

- ✅ `server/models/Theme.js` - Enhanced theme model
- ✅ `server/models/ThemeCharacter.js` - New character model
- ✅ `server/controllers/themeController.js` - All business logic
- ✅ `server/routes/themeRoutes.js` - All endpoints
- ✅ `server/utils/multerThemeConfig.js` - File upload config
- ✅ `server/index.js` - Integrated routes

### Uploads

- ✅ `server/uploads/themes/banners/` - Theme banners
- ✅ `server/uploads/themes/characters/` - Character images

### Documentation

- ✅ `THEME_MANAGEMENT_API.md` - Complete API docs
- ✅ `THEME_TESTING_GUIDE.md` - Detailed testing guide
- ✅ `THEME_SYSTEM_SUMMARY.md` - Full summary
- ✅ `test-theme-api.js` - Automated test script

## 🔑 Key Endpoints

```
# Public
GET  /api/themes/active          - Get active theme (no auth)

# Admin/Employee only
GET    /api/themes                - List themes (search/sort)
POST   /api/themes                - Create theme
PUT    /api/themes/:id            - Update theme
DELETE /api/themes/:id            - Delete theme
POST   /api/themes/:id/apply      - Apply theme

GET    /api/themes/characters/list    - List characters
POST   /api/themes/characters         - Create character
PUT    /api/themes/characters/:id     - Update character
DELETE /api/themes/characters/:id     - Delete character
```

## 📊 Features

### Theme Management

- ✨ Custom colors (5 colors: primary, secondary, background, text, accent)
- 🖼️ Banner image upload (max 10MB)
- 🎨 Layout options (classic, modern, minimal, creative)
- 🔍 Search by name/description
- 📈 Sort by name, date, popularity
- 🔄 Preview before publish
- ✅ Only one theme published at a time

### Theme Character Management

- 👤 Create characters with name + image
- 🔗 Link to theme
- 📸 Image upload (max 5MB)
- 🔢 Ordering support
- 🔍 Filter by theme
- ✏️ Full CRUD operations

## 🔒 Security

- **Admin & Employee**: Full access
- **Customer**: No access
- **Public**: Only active theme endpoint

## 🧪 Testing

### Run Automated Tests

```bash
node test-theme-api.js
```

### Manual Testing

See `THEME_TESTING_GUIDE.md` for:

- Detailed test cases
- cURL examples
- Postman setup
- Expected results

## 📚 Documentation

1. **THEME_MANAGEMENT_API.md**

   - Complete API reference
   - Request/response examples
   - Data models
   - Error handling

2. **THEME_TESTING_GUIDE.md**

   - Step-by-step test cases
   - All scenarios covered
   - Testing checklist
   - Troubleshooting

3. **THEME_SYSTEM_SUMMARY.md**
   - Full feature overview
   - Implementation details
   - Integration guide
   - Performance tips

## 💡 Example Usage

### Create Theme

```javascript
POST /api/themes
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

{
  name: "Ninjago Dark",
  description: "Dark ninja theme",
  colors: {
    primary: "#1a1a1a",
    secondary: "#ff0000"
  },
  layout: "modern",
  banner: <file>
}
```

### Get Active Theme (Frontend)

```javascript
const response = await fetch("http://localhost:5001/api/themes/active");
const { data: theme } = await response.json();

// Apply to website
document.documentElement.style.setProperty("--primary", theme.colors.primary);
```

### Create Character

```javascript
POST /api/themes/characters
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

{
  name: "Lloyd",
  themeId: "theme_id",
  description: "Green Ninja",
  image: <file>
}
```

## ✅ Validation

### Theme

- ✅ Unique name
- ✅ Valid layout enum
- ✅ Cannot delete published theme
- ✅ Cannot delete theme with characters
- ✅ Image size/type validation

### Character

- ✅ Image required
- ✅ Theme must exist
- ✅ Image size/type validation

## 🎯 Status

**✅ 100% Complete - Ready to Use!**

All 9 functions implemented with:

- Full CRUD operations
- Authentication & authorization
- Input validation
- File upload handling
- Error handling
- Documentation
- Automated tests

## 📞 Next Steps

1. ✅ Start server: `npm start`
2. ✅ Run tests: `node test-theme-api.js`
3. ✅ Read API docs: `THEME_MANAGEMENT_API.md`
4. ✅ Test manually: `THEME_TESTING_GUIDE.md`
5. 🔨 Integrate with frontend

## 🐛 Troubleshooting

- **Auth errors**: Check Bearer token
- **Upload fails**: Check file size/type
- **Delete fails**: Remove characters first, unpublish theme
- **No active theme**: Apply a theme first

---

**Ready to use! 🚀**

For detailed information, see:

- `THEME_MANAGEMENT_API.md` - API documentation
- `THEME_TESTING_GUIDE.md` - Testing guide
- `THEME_SYSTEM_SUMMARY.md` - Complete overview
