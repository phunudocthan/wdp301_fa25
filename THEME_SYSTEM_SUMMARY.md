# Theme Management System - Summary

## Tổng quan

Hệ thống quản lý Theme và Theme Character hoàn chỉnh cho LEGO E-commerce Website với 9 chức năng chính (51-59).

## Files đã tạo/chỉnh sửa

### 1. Models

- ✅ `server/models/Theme.js` - Model Theme với đầy đủ fields (colors, banner, layout, etc.)
- ✅ `server/models/ThemeCharacter.js` - Model Theme Character mới

### 2. Controllers

- ✅ `server/controllers/themeController.js` - Xử lý tất cả logic cho Theme và Theme Character

### 3. Routes

- ✅ `server/routes/themeRoutes.js` - Định nghĩa endpoints cho Theme và Theme Character

### 4. Utilities

- ✅ `server/utils/multerThemeConfig.js` - Cấu hình upload cho theme banners và character images

### 5. Server Integration

- ✅ `server/index.js` - Tích hợp theme routes và models vào server

### 6. Upload Directories

- ✅ `server/uploads/themes/banners/` - Thư mục lưu theme banners
- ✅ `server/uploads/themes/characters/` - Thư mục lưu character images

### 7. Documentation

- ✅ `THEME_MANAGEMENT_API.md` - API documentation đầy đủ
- ✅ `THEME_TESTING_GUIDE.md` - Hướng dẫn test chi tiết
- ✅ `test-theme-api.js` - Automated test script

## Chức năng đã implement

### Theme Management (Quản lý Theme)

#### ✅ Chức năng 51: Theme - Create

- Endpoint: `POST /api/themes`
- Features:
  - Tạo theme với custom colors (primary, secondary, background, text, accent)
  - Upload banner image (max 10MB)
  - Chọn layout (classic, modern, minimal, creative)
  - Validation: unique name, required fields
  - Auto-populate defaults

#### ✅ Chức năng 52: Theme - Update/Delete

- Update: `PUT /api/themes/:id`
- Delete: `DELETE /api/themes/:id`
- Features:
  - Cập nhật tất cả fields
  - Upload banner mới
  - Validation: không thể xóa theme có characters
  - Validation: không thể xóa published theme
  - Merge colors khi update

#### ✅ Chức năng 53: Theme - Search/Sort

- Endpoint: `GET /api/themes`
- Query Parameters:
  - `search` - Tìm kiếm theo name/description
  - `sortBy` - name, createdAt, popularity
  - `sortOrder` - asc, desc
  - `isActive` - Filter theo trạng thái
  - `isPublished` - Filter theo publish status
  - `page`, `limit` - Pagination
- Response: Includes pagination metadata

#### ✅ Chức năng 54: Theme - Apply

- Endpoint: `POST /api/themes/:id/apply`
- Features:
  - Preview mode: Xem trước không publish
  - Publish mode: Áp dụng theme cho website
  - Auto-unpublish theme cũ khi publish theme mới
  - Increment appliedCount
  - Chỉ 1 theme có thể published tại 1 thời điểm
- Public endpoint: `GET /api/themes/active` - Lấy theme đang áp dụng

### Theme Character Management (Quản lý Theme Character)

#### ✅ Chức năng 55: Theme Character - Create

- Endpoint: `POST /api/themes/characters`
- Features:
  - Tạo character với name, image, theme
  - Upload character image (max 5MB)
  - Link với theme (required)
  - Order field để sắp xếp
  - Validation: theme must exist

#### ✅ Chức năng 56: Theme Character - Update

- Endpoint: `PUT /api/themes/characters/:id`
- Features:
  - Cập nhật name, description
  - Upload image mới
  - Thay đổi theme liên kết
  - Cập nhật order

#### ✅ Chức năng 57: Theme Character - Delete

- Endpoint: `DELETE /api/themes/characters/:id`
- Features:
  - Xóa character
  - Không ảnh hưởng đến theme

#### ✅ Chức năng 58: Theme Character - View/List

- Endpoint: `GET /api/themes/characters/list`
- Query Parameters:
  - `search` - Tìm kiếm
  - `themeId` - Filter theo theme
  - `sortBy`, `sortOrder` - Sắp xếp
  - `page`, `limit` - Pagination
  - `isActive` - Filter theo trạng thái
- Features:
  - Populate theme info
  - Populate creator info

#### ✅ Chức năng 59: Theme Character - Detail

- Endpoint: `GET /api/themes/characters/:id`
- Features:
  - Chi tiết đầy đủ của character
  - Include theme information
  - Include creator information

### Additional Features

#### Theme Statistics

- Endpoint: `GET /api/themes/stats`
- Returns:
  - Total themes count
  - Active themes count
  - Published theme name
  - Total characters count
  - Top 5 popular themes

## API Endpoints Summary

```
Theme Management:
GET    /api/themes              - List themes (search/sort/filter)
GET    /api/themes/active       - Get active theme (public)
GET    /api/themes/stats        - Theme statistics
GET    /api/themes/:id          - Theme detail
POST   /api/themes              - Create theme
PUT    /api/themes/:id          - Update theme
DELETE /api/themes/:id          - Delete theme
POST   /api/themes/:id/apply    - Apply/preview theme

Theme Character Management:
GET    /api/themes/characters/list  - List characters
GET    /api/themes/characters/:id   - Character detail
POST   /api/themes/characters       - Create character
PUT    /api/themes/characters/:id   - Update character
DELETE /api/themes/characters/:id   - Delete character
```

## Security & Permissions

- **Admin & Employee**: Full access to all endpoints
- **Customer**: No access to theme management
- **Public**: Only `/api/themes/active` endpoint

## Data Models

### Theme Schema

```javascript
{
  name: String (required, unique),
  description: String,
  colors: {
    primary: String,
    secondary: String,
    background: String,
    text: String,
    accent: String
  },
  banner: String,
  layout: String (classic/modern/minimal/creative),
  isActive: Boolean,
  isPublished: Boolean,
  popularity: Number,
  appliedCount: Number,
  previewUrl: String,
  createdBy: ObjectId (User),
  timestamps: true
}
```

### ThemeCharacter Schema

```javascript
{
  name: String (required),
  image: String (required),
  themeId: ObjectId (Theme, required),
  description: String,
  isActive: Boolean,
  order: Number,
  createdBy: ObjectId (User),
  timestamps: true
}
```

## File Upload Configuration

### Theme Banner

- Location: `server/uploads/themes/banners/`
- Max Size: 10MB
- Allowed Types: JPEG, PNG, GIF, WebP
- Naming: `banner-{timestamp}-{random}.{ext}`

### Theme Character Image

- Location: `server/uploads/themes/characters/`
- Max Size: 5MB
- Allowed Types: JPEG, PNG, GIF, WebP
- Naming: `character-{timestamp}-{random}.{ext}`

## Validation Rules

### Theme

- ✅ Name: Required, unique, trimmed
- ✅ Colors: Optional with defaults
- ✅ Layout: Must be valid enum value
- ✅ Cannot delete published theme
- ✅ Cannot delete theme with characters
- ✅ Banner: Max 10MB, images only

### Theme Character

- ✅ Name: Required, trimmed
- ✅ Image: Required, max 5MB, images only
- ✅ ThemeId: Required, must exist
- ✅ Theme must be valid

## Testing

### Manual Testing

Xem `THEME_TESTING_GUIDE.md` cho:

- Detailed test cases
- cURL examples
- Postman collection setup
- Expected results

### Automated Testing

Run: `node test-theme-api.js`

Tests include:

- ✅ Theme CRUD operations
- ✅ Theme search/sort/filter
- ✅ Theme apply/preview
- ✅ Character CRUD operations
- ✅ Character list/filter
- ✅ Validation tests
- ✅ Duplicate prevention
- ✅ Statistics

## How to Use

### 1. Start Server

```bash
cd server
npm install  # if not done yet
npm start
```

### 2. Create Theme (Admin/Employee)

```javascript
const formData = new FormData();
formData.append("name", "Ninjago Theme");
formData.append("description", "Dark ninja theme");
formData.append(
  "colors",
  JSON.stringify({
    primary: "#1a1a1a",
    secondary: "#ff0000",
    accent: "#ffd700",
  })
);
formData.append("layout", "modern");
formData.append("banner", bannerFile);

const response = await fetch("http://localhost:5001/api/themes", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### 3. Apply Theme

```javascript
await fetch("http://localhost:5001/api/themes/:id/apply", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ preview: false }),
});
```

### 4. Get Active Theme (Public - for website frontend)

```javascript
const response = await fetch("http://localhost:5001/api/themes/active");
const { data: theme } = await response.json();

// Apply colors to CSS
document.documentElement.style.setProperty("--primary", theme.colors.primary);
document.documentElement.style.setProperty(
  "--secondary",
  theme.colors.secondary
);
// ...
```

### 5. Create Character

```javascript
const formData = new FormData();
formData.append("name", "Lloyd");
formData.append("themeId", themeId);
formData.append("description", "Green Ninja");
formData.append("order", 1);
formData.append("image", characterImage);

await fetch("http://localhost:5001/api/themes/characters", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

## Integration with Frontend

### Admin Panel

- Theme list với search/sort
- Create/Edit theme form với color picker
- Theme preview modal
- Apply/Publish buttons
- Character management per theme
- Drag-and-drop character ordering

### Public Website

- Fetch active theme on load
- Apply colors to CSS variables
- Display theme banner
- Show theme characters
- Responsive theme switching

## Performance Considerations

- ✅ Indexed fields: name, popularity, createdAt, themeId
- ✅ Pagination on all list endpoints
- ✅ Virtual populate for characters
- ✅ Efficient queries with proper filters
- ✅ File upload size limits

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:

- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Future Enhancements

Potential additions:

- [ ] Theme preview iframe
- [ ] Theme duplication
- [ ] Theme export/import
- [ ] Character animations
- [ ] Theme scheduling
- [ ] A/B testing
- [ ] Theme ratings
- [ ] Custom CSS injection

## Troubleshooting

### Issue: "Authentication required"

- Solution: Ensure Bearer token in Authorization header

### Issue: "Theme not found"

- Solution: Verify theme ID is valid and theme exists

### Issue: File upload fails

- Solution: Check file size and type, use multipart/form-data

### Issue: Cannot delete theme

- Solution: Remove characters first, unpublish theme

### Issue: No active theme

- Solution: Apply/publish a theme first

## Support

For issues or questions:

1. Check `THEME_MANAGEMENT_API.md` for API documentation
2. See `THEME_TESTING_GUIDE.md` for testing
3. Run `node test-theme-api.js` to verify functionality
4. Check server logs for detailed errors

## Completion Status

✅ **100% Complete**

All 9 chức năng (51-59) đã được implement và test:

- ✅ 51: Theme - Create
- ✅ 52: Theme - Update/Delete
- ✅ 53: Theme - Search/Sort
- ✅ 54: Theme - Apply
- ✅ 55: Theme Character - Create
- ✅ 56: Theme Character - Update
- ✅ 57: Theme Character - Delete
- ✅ 58: Theme Character - View/List
- ✅ 59: Theme Character - Detail

Plus additional features:

- ✅ Theme Statistics
- ✅ Active Theme (Public)
- ✅ Comprehensive validation
- ✅ File upload handling
- ✅ Full documentation
- ✅ Automated tests

## Ready for Production

System is ready to use with:

- ✅ Complete CRUD operations
- ✅ Proper authentication & authorization
- ✅ Input validation & error handling
- ✅ File upload with size/type limits
- ✅ Database indexes for performance
- ✅ Comprehensive documentation
- ✅ Test coverage
