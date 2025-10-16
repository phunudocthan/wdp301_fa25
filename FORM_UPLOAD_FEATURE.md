# Upload Ảnh Trong Form Thêm/Sửa Sản Phẩm

## 📸 Tổng quan

Đã thêm chức năng upload ảnh vào form tạo mới và chỉnh sửa sản phẩm với giao diện hiện đại hỗ trợ cả drag & drop và nhập URL.

## 🎯 Tính năng mới

### 1. **ImageUploadForm Component**

- **File**: `client/src/components/ImageUploadForm.tsx`
- **CSS**: `client/src/styles/ImageUploadForm.css`

#### Tính năng chính:

- ✅ **Drag & Drop Upload**: Kéo thả file từ máy tính
- ✅ **Click to Upload**: Click để chọn file
- ✅ **URL Input**: Nhập URL ảnh trực tiếp
- ✅ **Mixed Mode**: Kết hợp cả upload file và URL
- ✅ **Live Preview**: Xem trước ảnh ngay lập tức
- ✅ **Remove Individual**: Xóa từng ảnh riêng lẻ
- ✅ **Validation**: Kiểm tra file type và size
- ✅ **Loading States**: Hiển thị trạng thái upload

### 2. **ProductForm Integration**

- **File**: `client/src/components/ProductForm.tsx`
- Thay thế input URL cũ bằng ImageUploadForm component
- Tích hợp seamless với form validation existing

## ✨ Giao diện người dùng

### 🖱️ **Upload từ máy tính**

```
┌─────────────────────────────────┐
│  📷                            │
│  Click để chọn hoặc kéo thả ảnh │
│  JPG, PNG, WEBP (max 5MB)      │
└─────────────────────────────────┘
```

### 🔗 **Nhập URL ảnh**

```
┌─────────────────────────────────┐
│ https://example.com/image.jpg × │
│ [+ Thêm URL]                    │
└─────────────────────────────────┘
```

### 🖼️ **Preview Gallery**

```
┌─── Preview (3 ảnh) ────────────┐
│ [img×] [img×] [img×]           │
└────────────────────────────────┘
```

## 🔧 Workflow sử dụng

### **Thêm sản phẩm mới:**

1. Click "Thêm sản phẩm" trong trang quản lý
2. Điền thông tin sản phẩm
3. Trong section "Hình ảnh":
   - **Option A**: Kéo thả ảnh từ máy tính
   - **Option B**: Click để chọn file
   - **Option C**: Nhập URL ảnh
   - **Option D**: Kết hợp cả upload và URL
4. Xem preview ảnh trong gallery
5. Submit form để tạo sản phẩm

### **Chỉnh sửa sản phẩm:**

1. Click "Chỉnh sửa" từ danh sách hoặc trang chi tiết
2. Form hiển thị ảnh hiện tại
3. Có thể:
   - Thêm ảnh mới (upload hoặc URL)
   - Xóa ảnh cũ
   - Thay thế ảnh
4. Submit để cập nhật

## 📋 Technical Details

### **File Types & Limits**

- **Supported**: JPG, JPEG, PNG, WEBP
- **Max Size**: 5MB per file
- **Max Images**: 5 ảnh per product
- **Upload Method**: Multer + FormData

### **State Management**

```typescript
// Form state
const [imageUrls, setImageUrls] = useState<string[]>([""]);

// Auto sync với formData
onImagesChange={(newImages) => {
  setImageUrls(newImages);
  setFormData(prev => ({
    ...prev,
    images: newImages.filter(img => img.trim() !== '')
  }));
}}
```

### **API Integration**

- Sử dụng `UploadAPI.uploadProductImages()`
- Auto append uploaded URLs vào images array
- Mix với URL inputs seamlessly

## 🎨 UI/UX Features

### **Visual States**

- **Default**: Dashed border upload zone
- **Hover**: Blue border highlight
- **Drag Over**: Scale animation + color change
- **Uploading**: Green theme + spinner
- **Error**: Validation messages

### **Responsive Behavior**

- **Desktop**: Side-by-side layout cho upload methods
- **Mobile**: Stacked layout, optimized touch targets
- **Tablet**: Balanced layout cho cả hai

### **Accessibility**

- Keyboard navigation support
- Screen reader friendly
- Clear visual hierarchy
- Focus indicators

## 🔄 Form Integration

### **Create Product Flow**

```
Tạo sản phẩm → Upload ảnh → Preview → Submit
                    ↓
              Server stores files
                    ↓
              Returns URLs → Add to form → Save product
```

### **Edit Product Flow**

```
Load product → Show existing images → Add/Remove → Update
                     ↓
              Mix old URLs + new uploads → Submit
```

## 📁 File Structure

```
client/src/
├── components/
│   ├── ImageUploadForm.tsx        # New upload component
│   └── ProductForm.tsx            # Updated with upload
├── styles/
│   └── ImageUploadForm.css        # Upload styles
└── api/
    └── upload.ts                  # Upload API calls
```

## 🚀 Benefits

### **For Users**

- ✅ **Flexible**: Upload files OR input URLs
- ✅ **Fast**: Drag & drop interface
- ✅ **Visual**: Live preview feedback
- ✅ **Reliable**: Error handling & validation

### **For Developers**

- ✅ **Reusable**: Component có thể dùng ở nhiều nơi
- ✅ **Maintainable**: Clean separation of concerns
- ✅ **Extensible**: Easy to add new features
- ✅ **Type Safe**: Full TypeScript support

## ✅ Hoàn thành

- ✅ ImageUploadForm component với full features
- ✅ Integration vào ProductForm
- ✅ Drag & drop functionality
- ✅ URL input support
- ✅ Live preview gallery
- ✅ File validation
- ✅ Error handling
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Loading states

Bây giờ form thêm/sửa sản phẩm đã có đầy đủ chức năng upload ảnh hiện đại! 🎉
