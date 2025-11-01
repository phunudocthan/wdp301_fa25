# Hướng dẫn sử dụng tính năng CRUD sản phẩm Admin

## Tổng quan

Tính năng CRUD sản phẩm cho phép admin quản lý toàn bộ sản phẩm LEGO trong hệ thống, bao gồm:

- ✅ **Create**: Tạo sản phẩm mới
- 📖 **Read**: Xem danh sách và chi tiết sản phẩm
- ✏️ **Update**: Chỉnh sửa thông tin sản phẩm
- 🗑️ **Delete**: Xóa sản phẩm

## Cấu trúc đã triển khai

### Backend API Routes

```
GET    /api/products/admin/stats      - Thống kê sản phẩm
GET    /api/products/admin           - Danh sách sản phẩm (có phân trang)
GET    /api/products/admin/:id       - Chi tiết sản phẩm
POST   /api/products/admin           - Tạo sản phẩm mới
PUT    /api/products/admin/:id       - Cập nhật sản phẩm
PATCH  /api/products/admin/:id/status - Cập nhật trạng thái
DELETE /api/products/admin/:id       - Xóa sản phẩm

GET    /api/helpers/themes           - Danh sách themes
GET    /api/helpers/age-ranges       - Danh sách độ tuổi
GET    /api/helpers/difficulties     - Danh sách độ khó
```

### Frontend Components

- `AdminProductManagement.tsx` - Component chính quản lý sản phẩm
- `ProductList.tsx` - Hiển thị danh sách sản phẩm
- `ProductForm.tsx` - Form tạo/chỉnh sửa sản phẩm
- `ProductStats.tsx` - Hiển thị thống kê

## Cách sử dụng

### 1. Truy cập trang quản lý

- Đăng nhập với tài khoản admin
- Vào Admin Dashboard: `http://localhost:3000/admin`
- Click "Quản lý sản phẩm" hoặc truy cập: `http://localhost:3000/admin/products`

### 2. Xem danh sách sản phẩm

- Hiển thị thống kê tổng quan (tổng sản phẩm, đang hoạt động, chờ duyệt, v.v.)
- Danh sách sản phẩm với thông tin: tên, theme, giá, tồn kho, trạng thái
- Phân trang tự động nếu có nhiều sản phẩm

### 3. Tìm kiếm và lọc

- **Tìm kiếm**: Nhập tên sản phẩm và nhấn "Tìm kiếm"
- **Lọc theo trạng thái**: Chọn "Hoạt động", "Chờ duyệt", hoặc "Không hoạt động"
- **Sắp xếp**: Theo tên, giá, ngày tạo, tồn kho

### 4. Tạo sản phẩm mới

1. Click nút "+ Thêm sản phẩm"
2. Điền thông tin:
   - **Tên sản phẩm** (bắt buộc)
   - **Theme** (bắt buộc)
   - **Độ tuổi** (bắt buộc)
   - **Độ khó** (bắt buộc)
   - **Số miếng**: số lượng chi tiết
   - **Giá** (bắt buộc): tính bằng USD, hỗ trợ số thập phân (ví dụ: 159.99)
   - **Tồn kho**: số lượng có sẵn
   - **Trạng thái**: Chờ duyệt/Hoạt động/Không hoạt động
   - **Hình ảnh**: URL các hình ảnh sản phẩm
3. Click "Tạo mới"

### 5. Chỉnh sửa sản phẩm

1. Click biểu tượng ✏️ tại hàng sản phẩm cần sửa
2. Cập nhật thông tin trong form
3. Click "Cập nhật"

### 6. Cập nhật trạng thái nhanh

- Sử dụng dropdown trạng thái trực tiếp trong bảng danh sách
- Thay đổi sẽ được lưu tự động

### 7. Xóa sản phẩm

1. Click biểu tượng 🗑️ tại hàng sản phẩm cần xóa
2. Xác nhận trong dialog popup
3. Sản phẩm sẽ bị xóa vĩnh viễn

## Tính năng nâng cao

### Phân trang

- Hiển thị 10 sản phẩm mỗi trang
- Điều hướng "Trước/Sau"
- Hiển thị thông tin trang hiện tại

### Responsive Design

- Giao diện thích ứng với màn hình điện thoại
- Bảng có thể cuộn ngang trên màn hình nhỏ

### Validation

- Kiểm tra dữ liệu đầu vào
- Hiển thị lỗi rõ ràng
- Ngăn tạo sản phẩm trùng tên

### Real-time Updates

- Danh sách tự động cập nhật sau mỗi thao tác
- Thống kê cập nhật theo thời gian thực

## Cấu trúc dữ liệu

### Product Model

```javascript
{
  name: String,          // Tên sản phẩm
  themeId: ObjectId,     // ID của theme
  ageRangeId: ObjectId,  // ID của độ tuổi
  difficultyId: ObjectId,// ID của độ khó
  pieces: Number,        // Số miếng
  price: Number,         // Giá (USD)
  stock: Number,         // Tồn kho
  status: String,        // 'pending'|'active'|'inactive'
  images: [String],      // Mảng URL hình ảnh
  createdBy: ObjectId,   // ID admin tạo
  createdAt: Date,       // Ngày tạo
  updatedAt: Date        // Ngày cập nhật
}
```

## Bảo mật

- Tất cả API routes yêu cầu authentication
- Chỉ admin có thể truy cập
- Validation dữ liệu đầu vào
- Kiểm tra quyền trước khi thực hiện thao tác

## API Examples

### Tạo sản phẩm mới

```javascript
POST /api/products/admin
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "LEGO City Police Station",
  "themeId": "64f...",
  "ageRangeId": "64f...",
  "difficultyId": "64f...",
  "pieces": 854,
  "price": 249.99,
  "stock": 50,
  "status": "active",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

### Lấy danh sách sản phẩm

```javascript
GET /api/products/admin?page=1&limit=10&search=police&status=active&sortBy=price&sortOrder=desc
Authorization: Bearer <admin_token>
```

### Cập nhật sản phẩm

```javascript
PUT /api/products/admin/64f...
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 230.00,
  "stock": 45
}
```

## Troubleshooting

### Lỗi thường gặp

1. **"Unauthorized"**: Kiểm tra đăng nhập admin
2. **"Tên sản phẩm đã tồn tại"**: Đổi tên khác
3. **"Thông tin theme/độ tuổi/độ khó không hợp lệ"**: Kiểm tra dữ liệu cơ sở
4. **"Không tìm thấy sản phẩm"**: Sản phẩm có thể đã bị xóa

### Debug

- Kiểm tra console log trong browser
- Xem Network tab trong DevTools
- Kiểm tra server logs

---

## Cài đặt và chạy

### Prerequisites

- Node.js v16+
- MongoDB database
- Admin account với role "admin"

### Backend

```bash
cd server
npm install
npm run dev  # Server chạy trên port 5001
```

### Frontend

```bash
cd client
npm install
npx vite     # Client chạy trên port 3000
```

### Seed dữ liệu mẫu

```bash
cd server
node seedHelperData.js  # Tạo themes, age ranges, difficulties
```

---

**Chúc bạn sử dụng tính năng hiệu quả! 🚀**
