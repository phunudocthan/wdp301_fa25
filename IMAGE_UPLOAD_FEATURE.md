# Chức Năng Upload Ảnh Sản Phẩm

## 📸 Tổng quan

Đã thêm chức năng upload ảnh từ máy tính cho trang chi tiết sản phẩm admin với giao diện kéo thả hiện đại.

## 🎯 Các thành phần đã tạo

### 1. **Server-side**

#### Multer Configuration (`server/utils/multerProductConfig.js`)

- Cấu hình upload cho product images
- Lưu vào thư mục `uploads/products/`
- Hỗ trợ: JPG, JPEG, PNG, WEBP
- Giới hạn: 5MB per file
- Filename format: `product-{timestamp}-{random}.ext`

#### Upload Routes (`server/routes/uploadRoutes.js`)

- **POST `/api/upload/product-images`**: Upload multiple images (max 5)
- **POST `/api/upload/product-image`**: Upload single image
- Yêu cầu authentication (admin)
- Trả về URLs của images đã upload

#### Server Integration (`server/index.js`)

- Thêm route `/api/upload`
- Static file serving cho `/uploads`

### 2. **Client-side**

#### Upload API (`client/src/api/upload.ts`)

- `uploadProductImages(files)`: Upload multiple files
- `uploadProductImage(file)`: Upload single file
- Sử dụng FormData và axios

#### ImageUpload Component (`client/src/components/ImageUpload.tsx`)

- **Drag & Drop**: Kéo thả ảnh vào vùng upload
- **Click to Upload**: Click để chọn files
- **Preview**: Hiển thị ảnh hiện tại với grid layout
- **Remove**: Xóa ảnh cá nhân
- **Validation**: Kiểm tra file type và size
- **Loading States**: Hiển thị trạng thái upload

#### Styles (`client/src/styles/ImageUpload.css`)

- Modern drag & drop interface
- Responsive grid layout
- Hover effects và animations
- Loading spinner
- Mobile-optimized

### 3. **Integration**

#### AdminProductDetail (`client/src/pages/AdminProductDetail.tsx`)

- Thêm ImageUpload component
- Handler để cập nhật images trong state
- Tích hợp với existing gallery

## ✨ Tính năng

### 🖱️ **Drag & Drop Interface**

- Kéo thả ảnh vào vùng upload
- Visual feedback khi drag over
- Hover states và animations

### 📁 **File Management**

- Upload multiple files cùng lúc (max 5)
- File validation (type, size)
- Progress indicator
- Error handling

### 🖼️ **Image Gallery**

- Grid layout responsive
- Hover preview effects
- Individual image removal
- Auto-update product data

### 📱 **Responsive Design**

- Mobile-first approach
- Touch-friendly controls
- Adaptive grid layout

## 🔧 **Cách sử dụng**

### 1. **Truy cập trang chi tiết sản phẩm**

```
/admin/products/{product_id}
```

### 2. **Upload ảnh**

- **Drag & Drop**: Kéo ảnh từ máy tính vào vùng "Upload Area"
- **Click Upload**: Click vào vùng upload để chọn files
- **Multiple Selection**: Có thể chọn nhiều ảnh cùng lúc

### 3. **Quản lý ảnh**

- **Xem**: Ảnh được hiển thị trong grid
- **Xóa**: Click nút × trên ảnh để xóa
- **Update**: Ảnh được cập nhật real-time

## 📋 **File Types & Limits**

### Supported Formats

- ✅ JPG/JPEG
- ✅ PNG
- ✅ WEBP

### Limitations

- 📏 **File Size**: Max 5MB per file
- 📊 **Quantity**: Max 5 files per upload
- 🔒 **Access**: Admin only

## 🎨 **UI/UX Features**

### Visual States

- **Default**: Dashed border với upload icon
- **Hover**: Blue border và background
- **Drag Over**: Scale animation và color change
- **Uploading**: Green theme với spinner
- **Error**: Red theme với error message

### Responsive Behavior

- **Desktop**: 4-column grid
- **Tablet**: 3-column grid
- **Mobile**: 2-column grid với always-visible remove buttons

## 🔄 **API Endpoints**

### Upload Multiple Images

```
POST /api/upload/product-images
Content-Type: multipart/form-data
Field: images[] (max 5 files)

Response:
{
  "success": true,
  "message": "Upload ảnh thành công",
  "data": {
    "images": ["url1", "url2", ...]
  }
}
```

### Upload Single Image

```
POST /api/upload/product-image
Content-Type: multipart/form-data
Field: image (single file)

Response:
{
  "success": true,
  "message": "Upload ảnh thành công",
  "data": {
    "image": "image_url"
  }
}
```

## 🛡️ **Security Features**

- **Authentication**: Yêu cầu admin login
- **File Validation**: Chỉ accept image files
- **Size Limits**: Giới hạn file size
- **Path Security**: Safe filename generation
- **Error Handling**: Comprehensive error messages

## 📁 **File Structure**

```
server/
├── utils/
│   └── multerProductConfig.js     # Multer config cho products
├── routes/
│   └── uploadRoutes.js            # Upload API endpoints
└── uploads/
    └── products/                  # Thư mục lưu ảnh products

client/
├── src/
│   ├── api/
│   │   └── upload.ts              # Upload API functions
│   ├── components/
│   │   └── ImageUpload.tsx        # Upload component
│   ├── styles/
│   │   └── ImageUpload.css        # Upload styles
│   └── pages/
│       └── AdminProductDetail.tsx # Tích hợp upload
```

## 🚀 **Ready to Use!**

Chức năng upload ảnh đã hoàn thiện và sẵn sàng sử dụng:

1. ✅ Server API endpoints
2. ✅ Client upload component
3. ✅ UI/UX design
4. ✅ Error handling
5. ✅ Responsive design
6. ✅ Integration với product detail

Bây giờ admin có thể dễ dàng upload và quản lý ảnh sản phẩm trực tiếp từ trang chi tiết! 🎉
