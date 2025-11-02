# Theme Management System - API Documentation

Hệ thống quản lý Theme và Theme Character cho website LEGO E-commerce.

## Tính năng chính

### Theme Management (Quản lý Theme)

#### 51. Theme - Create (Tạo Theme mới)

- **Endpoint**: `POST /api/themes`
- **Authentication**: Required (Admin/Employee)
- **Features**:
  - Tạo theme với màu sắc tùy chỉnh
  - Upload banner image
  - Cấu hình layout
  - Tự động validation

#### 52. Theme - Update/Delete (Cập nhật/Xóa Theme)

- **Update Endpoint**: `PUT /api/themes/:id`
- **Delete Endpoint**: `DELETE /api/themes/:id`
- **Authentication**: Required (Admin/Employee)
- **Features**:
  - Cập nhật thông tin theme
  - Thay đổi màu sắc và layout
  - Xóa theme (với kiểm tra ràng buộc)

#### 53. Theme - Search/Sort (Tìm kiếm/Sắp xếp)

- **Endpoint**: `GET /api/themes`
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `search`: Tìm kiếm theo tên, mô tả
  - `sortBy`: name, createdAt, popularity
  - `sortOrder`: asc, desc
  - `page`, `limit`: Phân trang
  - `isActive`, `isPublished`: Lọc theo trạng thái

#### 54. Theme - Apply (Áp dụng Theme)

- **Endpoint**: `POST /api/themes/:id/apply`
- **Authentication**: Required (Admin/Employee)
- **Features**:
  - Áp dụng theme cho website
  - Preview trước khi publish
  - Tự động unpublish các theme khác

#### 55. Theme - Get Active Theme (Lấy Theme đang áp dụng)

- **Endpoint**: `GET /api/themes/active`
- **Authentication**: Public
- **Usage**: Website frontend sử dụng để lấy theme hiện tại

### Theme Character Management (Quản lý Theme Character)

#### 55. Theme Character - Create (Tạo Character mới)

- **Endpoint**: `POST /api/themes/characters`
- **Authentication**: Required (Admin/Employee)
- **Features**:
  - Tạo character với tên, hình ảnh
  - Liên kết với theme
  - Upload character image

#### 56. Theme Character - Update (Cập nhật Character)

- **Endpoint**: `PUT /api/themes/characters/:id`
- **Authentication**: Required (Admin/Employee)
- **Features**:
  - Cập nhật thông tin character
  - Thay đổi theme liên kết
  - Upload hình ảnh mới

#### 57. Theme Character - Delete (Xóa Character)

- **Endpoint**: `DELETE /api/themes/characters/:id`
- **Authentication**: Required (Admin/Employee)

#### 58. Theme Character - View/List (Danh sách Character)

- **Endpoint**: `GET /api/themes/characters/list`
- **Authentication**: Required (Admin/Employee)
- **Query Parameters**:
  - `search`: Tìm kiếm
  - `themeId`: Lọc theo theme
  - `sortBy`, `sortOrder`: Sắp xếp
  - `page`, `limit`: Phân trang

#### 59. Theme Character - Detail (Chi tiết Character)

- **Endpoint**: `GET /api/themes/characters/:id`
- **Authentication**: Required (Admin/Employee)

## API Endpoints Overview

### Theme Endpoints

```
GET    /api/themes              - Danh sách themes (với search/sort/filter)
GET    /api/themes/active       - Lấy theme đang áp dụng (public)
GET    /api/themes/stats        - Thống kê themes
GET    /api/themes/:id          - Chi tiết theme
POST   /api/themes              - Tạo theme mới
PUT    /api/themes/:id          - Cập nhật theme
DELETE /api/themes/:id          - Xóa theme
POST   /api/themes/:id/apply    - Áp dụng theme
```

### Theme Character Endpoints

```
GET    /api/themes/characters/list  - Danh sách characters
GET    /api/themes/characters/:id   - Chi tiết character
POST   /api/themes/characters       - Tạo character mới
PUT    /api/themes/characters/:id   - Cập nhật character
DELETE /api/themes/characters/:id   - Xóa character
```

## Data Models

### Theme Model

```javascript
{
  name: String,              // Tên theme (required, unique)
  description: String,       // Mô tả
  colors: {
    primary: String,         // Màu chính (#1E40AF)
    secondary: String,       // Màu phụ (#7C3AED)
    background: String,      // Màu nền (#FFFFFF)
    text: String,           // Màu text (#1F2937)
    accent: String          // Màu nhấn (#F59E0B)
  },
  banner: String,           // URL banner image
  layout: String,           // classic, modern, minimal, creative
  isActive: Boolean,        // Theme có hoạt động không
  isPublished: Boolean,     // Theme đang được áp dụng
  popularity: Number,       // Độ phổ biến
  appliedCount: Number,     // Số lần được áp dụng
  previewUrl: String,       // URL preview
  createdBy: ObjectId,      // User tạo
  timestamps: true          // createdAt, updatedAt
}
```

### Theme Character Model

```javascript
{
  name: String,              // Tên character (required)
  image: String,             // URL hình ảnh (required)
  themeId: ObjectId,         // Liên kết với theme (required)
  description: String,       // Mô tả
  isActive: Boolean,         // Character có hoạt động không
  order: Number,             // Thứ tự hiển thị
  createdBy: ObjectId,       // User tạo
  timestamps: true           // createdAt, updatedAt
}
```

## Request Examples

### 1. Create Theme

```bash
POST /api/themes
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "name": "Summer Vibes",
  "description": "Bright and colorful summer theme",
  "colors": {
    "primary": "#FF6B6B",
    "secondary": "#4ECDC4",
    "background": "#FFE66D",
    "text": "#2C3E50",
    "accent": "#95E1D3"
  },
  "layout": "modern",
  "banner": <file>
}
```

### 2. Search Themes

```bash
GET /api/themes?search=summer&sortBy=popularity&sortOrder=desc&page=1&limit=10
Authorization: Bearer <token>
```

### 3. Apply Theme

```bash
POST /api/themes/:id/apply
Authorization: Bearer <token>

{
  "preview": false  // false = publish, true = preview only
}
```

### 4. Create Theme Character

```bash
POST /api/themes/characters
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "name": "Ninjago Lloyd",
  "themeId": "507f1f77bcf86cd799439011",
  "description": "Green Ninja character",
  "order": 1,
  "image": <file>
}
```

### 5. Get Theme Characters by Theme

```bash
GET /api/themes/characters/list?themeId=507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

## Response Examples

### Success Response

```json
{
  "message": "Theme created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Summer Vibes",
    "description": "Bright and colorful summer theme",
    "colors": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "background": "#FFE66D",
      "text": "#2C3E50",
      "accent": "#95E1D3"
    },
    "banner": "/uploads/themes/banners/banner-1234567890.jpg",
    "layout": "modern",
    "isActive": true,
    "isPublished": false,
    "popularity": 0,
    "appliedCount": 0,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "admin",
      "email": "admin@example.com"
    },
    "characters": [],
    "createdAt": "2025-10-28T09:36:00.000Z",
    "updatedAt": "2025-10-28T09:36:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "data": [
    {
      /* theme object */
    },
    {
      /* theme object */
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Error Response

```json
{
  "error": "Theme name already exists"
}
```

## Validation Rules

### Theme

- Name: Required, unique, trimmed
- Colors: Optional (có defaults)
- Layout: Must be one of: classic, modern, minimal, creative
- Banner: Optional, max 10MB, image only
- Cannot delete published theme
- Cannot delete theme with characters

### Theme Character

- Name: Required, trimmed
- Image: Required, max 5MB, image only
- ThemeId: Required, must exist
- Theme must exist and be valid

## Security & Permissions

- **Admin & Employee**: Full access to all endpoints
- **Customer**: No access to theme management
- **Public**: Only access to `/api/themes/active`

## File Upload Limits

- Theme Banner: 10MB max (JPEG, PNG, GIF, WebP)
- Character Image: 5MB max (JPEG, PNG, GIF, WebP)

## Statistics Endpoint

```bash
GET /api/themes/stats
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "totalThemes": 15,
    "activeThemes": 12,
    "publishedTheme": "Summer Vibes",
    "totalCharacters": 48,
    "popularThemes": [
      {
        "name": "Ninjago Dark",
        "popularity": 150,
        "appliedCount": 45
      }
    ]
  }
}
```

## Testing

Xem file `THEME_TESTING_GUIDE.md` để biết chi tiết về cách test các API endpoints.

## Frontend Integration

### Lấy theme hiện tại cho website:

```javascript
// Public endpoint - không cần authentication
const response = await fetch("http://localhost:5001/api/themes/active");
const { data: theme } = await response.json();

// Apply theme colors to website
document.documentElement.style.setProperty(
  "--primary-color",
  theme.colors.primary
);
document.documentElement.style.setProperty(
  "--secondary-color",
  theme.colors.secondary
);
// ...
```

### Admin panel - Quản lý themes:

```javascript
// Get all themes with search
const response = await fetch(
  "http://localhost:5001/api/themes?search=summer&sortBy=popularity&sortOrder=desc",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const { data: themes, pagination } = await response.json();
```

## Notes

- Theme chỉ có thể xóa khi:
  - Không có characters
  - Không đang được publish
- Khi apply theme mới, theme cũ sẽ tự động unpublish
- Preview mode không thay đổi theme đang publish
- Upload files tự động validate type và size
