# Test Upload Image Functionality

## 🔧 Fixed Issues

### Server Error Fix

- **Problem**: `TypeError: argument handler must be a function`
- **Cause**: Incorrect import of middleware `requireAuth`
- **Solution**: Changed from `const requireAuth = require(...)` to `const { requireAuth } = require(...)`

### File Changes

```javascript
// BEFORE (uploadRoutes.js)
const requireAuth = require("../middleware/authMiddleware");

// AFTER (uploadRoutes.js)
const { requireAuth } = require("../middleware/authMiddleware");
```

## 🧪 Testing Steps

### 1. Start Server

```bash
cd server
npm start
```

Expected: Server should start without errors on port 5001

### 2. Start Client

```bash
cd client
npm start
```

Expected: Client should start on port 3000

### 3. Test Upload Endpoints

#### Test Single Image Upload

```bash
curl -X POST http://localhost:5001/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

#### Test Multiple Images Upload

```bash
curl -X POST http://localhost:5001/api/upload/product-images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 4. Test UI Components

1. Login as admin
2. Go to `/admin/products`
3. Click on any product to view details
4. Scroll to "Quản lý hình ảnh" section
5. Test drag & drop or click upload
6. Verify images appear in gallery
7. Test image removal

## 📋 Expected Behavior

### Upload Area

- ✅ Shows drag & drop zone
- ✅ Accepts jpg, png, webp files
- ✅ Validates file size (5MB max)
- ✅ Shows loading spinner during upload
- ✅ Updates product images immediately

### Image Gallery

- ✅ Displays current images in grid
- ✅ Shows remove button on hover
- ✅ Confirms before deletion
- ✅ Updates gallery after removal

### Error Handling

- ✅ Shows error for invalid file types
- ✅ Shows error for oversized files
- ✅ Shows server errors from API
- ✅ Recovers gracefully from failures

## 🐛 Common Issues & Solutions

### Server Issues

- **Port in use**: Change port in .env or kill existing process
- **CORS errors**: Check CLIENT_ORIGIN in server .env
- **File permissions**: Ensure uploads/ directory is writable

### Client Issues

- **Network errors**: Check server is running on correct port
- **Auth errors**: Ensure valid admin token
- **File upload fails**: Check file size and type restrictions

## 🎯 Success Criteria

✅ Server starts without crashes
✅ Upload endpoints respond correctly  
✅ UI shows upload component
✅ Drag & drop works
✅ File validation works
✅ Images display in gallery
✅ Remove functionality works
✅ Product data updates correctly

## 📱 Mobile Testing

1. Open dev tools mobile view
2. Test touch interactions
3. Verify responsive layout
4. Check file picker on mobile
5. Test image removal on touch

The upload functionality should now work completely! 🚀
