# Hướng Dẫn Cấu Hình Facebook Login

## 📋 Tổng Quan

Tính năng đăng nhập với Facebook đã được tích hợp vào hệ thống, cho phép người dùng đăng nhập nhanh chóng bằng tài khoản Facebook của họ.

## 🚀 Các Tính Năng Đã Triển Khai

### Backend (Server)

- ✅ Cài đặt `passport-facebook`
- ✅ Cấu hình Facebook Strategy trong `authController.js`
- ✅ Thêm routes `/auth/facebook` và `/auth/facebook/callback`
- ✅ Cập nhật User model với trường `facebookId`
- ✅ Xử lý callback và tạo JWT token
- ✅ Log hoạt động đăng nhập Facebook

### Frontend (Client)

- ✅ Thêm nút "Continue with Facebook" trong trang đăng nhập
- ✅ Xử lý redirect từ Facebook OAuth
- ✅ Tự động điều hướng sau khi đăng nhập thành công
- ✅ UI/UX tương thích với thiết kế LEGO

## 📝 Cấu Hình Facebook App

### Bước 1: Tạo Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Đăng nhập với tài khoản Facebook của bạn
3. Click **"My Apps"** → **"Create App"**
4. Chọn **"Consumer"** hoặc **"Business"** tùy nhu cầu
5. Điền thông tin:
   - **App Display Name**: Lego Shop
   - **App Contact Email**: your-email@example.com
6. Click **"Create App"**

### Bước 2: Cấu Hình Facebook Login

1. Trong Dashboard của App, tìm **"Facebook Login"**
2. Click **"Set Up"**
3. Chọn **"Web"** platform
4. Điền **Site URL**: `http://localhost:3000`
5. Lưu lại

### Bước 3: Cấu Hình OAuth Redirect URIs

1. Trong menu bên trái, chọn **"Facebook Login"** → **"Settings"**
2. Thêm **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5001/auth/facebook/callback
   http://localhost:3000
   ```
3. **Save Changes**

### Bước 4: Lấy App ID và App Secret

1. Trong menu bên trái, chọn **"Settings"** → **"Basic"**
2. Copy **App ID**
3. Click **"Show"** để hiển thị **App Secret** (cần nhập mật khẩu Facebook)
4. Copy **App Secret**

### Bước 5: Cấu Hình App Domains

1. Vẫn ở trang **"Settings"** → **"Basic"**
2. Tìm **"App Domains"**
3. Thêm: `localhost`
4. **Save Changes**

### Bước 6: Chuyển App sang Live Mode (Tùy chọn)

Khi phát triển, bạn có thể để ở **Development Mode**.
Khi deploy production:

1. Chọn **"App Review"** trong menu
2. Làm theo hướng dẫn để submit app review
3. Sau khi được approve, chuyển sang **Live Mode**

## ⚙️ Cấu Hình Server (.env)

Tạo hoặc cập nhật file `.env` trong thư mục `server/`:

```env
# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5001/auth/facebook/callback

# Client URL (Required)
CLIENT_URL=http://localhost:3000

# JWT Secret (Required)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h

# Session Secret (Required for OAuth)
SESSION_SECRET=your_session_secret_here
```

### Lưu Ý Bảo Mật:

- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên Git
- ⚠️ Giữ `FACEBOOK_APP_SECRET` bí mật tuyệt đối
- ✅ Sử dụng file `.env.example` để hướng dẫn

## 🔧 Cấu Hình Production

Khi deploy lên production, cập nhật:

```env
# Production URLs
FACEBOOK_CALLBACK_URL=https://yourdomain.com/auth/facebook/callback
CLIENT_URL=https://yourdomain.com

# Trong Facebook App Settings:
# - Valid OAuth Redirect URIs: https://yourdomain.com/auth/facebook/callback
# - App Domains: yourdomain.com
```

## 🧪 Test Tính Năng

### 1. Khởi động Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:5001`

### 2. Khởi động Client

```bash
cd client
npm run dev
```

Client sẽ chạy tại: `http://localhost:3000`

### 3. Test Login Flow

1. Truy cập `http://localhost:3000/login`
2. Click nút **"Continue with Facebook"**
3. Đăng nhập với tài khoản Facebook (lần đầu sẽ cần authorize app)
4. Sau khi authorize, bạn sẽ được redirect về trang chủ
5. Kiểm tra console/network để xem token được tạo

### 4. Verify User trong Database

```bash
# Kết nối MongoDB
mongo

# Chọn database
use lego-shop

# Kiểm tra user
db.users.find({ facebookId: { $exists: true } })
```

## 📊 Database Schema

User model đã được cập nhật với trường `facebookId`:

```javascript
{
  name: String,
  email: String,
  facebookId: String,  // ← NEW FIELD
  googleId: String,
  avatar: String,
  isVerified: Boolean,
  role: String,
  // ... các trường khác
}
```

## 🔐 Bảo Mật

### 1. Token Validation

- JWT token được tạo sau khi Facebook OAuth thành công
- Token có thời gian hết hạn (mặc định 1h)
- Token được lưu trong localStorage

### 2. Account Linking

- Nếu email đã tồn tại, hệ thống sẽ liên kết với tài khoản hiện có
- User có thể đăng nhập bằng cả Facebook và password

### 3. Activity Logging

- Mọi lần đăng nhập Facebook đều được ghi log
- IP và device được lưu trong ActivityLog

## 🐛 Troubleshooting

### Lỗi: "URL Blocked: This redirect failed"

**Nguyên nhân**: OAuth Redirect URI không được cấu hình đúng

**Giải pháp**:

1. Vào Facebook App Settings
2. Kiểm tra **Valid OAuth Redirect URIs**
3. Đảm bảo có: `http://localhost:5001/auth/facebook/callback`

### Lỗi: "App Not Setup: This app is still in development mode"

**Nguyên nhân**: App chưa được public

**Giải pháp**:

- Thêm tài khoản test trong **"Roles"** → **"Test Users"**
- Hoặc chuyển app sang Live Mode (cần review)

### Lỗi: "Given URL is not allowed by the Application configuration"

**Nguyên nhân**: App Domains không đúng

**Giải pháp**:

1. Vào **Settings** → **Basic**
2. Thêm `localhost` vào **App Domains**
3. Save changes

### Lỗi: "The user has not granted the 'email' permission"

**Nguyên nhân**: User không cấp quyền email

**Giải pháp**:

- Hệ thống vẫn tạo user nhưng không có email
- Yêu cầu user cập nhật email sau khi đăng nhập

### Lỗi: Cannot read property 'user' of undefined

**Nguyên nhân**: Session middleware chưa được cấu hình

**Giải pháp**:

- Kiểm tra `SESSION_SECRET` trong .env
- Restart server sau khi thêm biến môi trường

## 📱 UI Components

### Facebook Button Style

```tsx
facebookButton: {
  borderColor: "#1877F2",  // Facebook blue
  color: "#1877F2",
  background: "white",
  // Hover effects được xử lý trong component
}
```

## 🔄 Flow Diagram

```
User clicks "Continue with Facebook"
    ↓
Redirect to /auth/facebook
    ↓
Facebook OAuth Login Page
    ↓
User authorizes app
    ↓
Facebook redirects to /auth/facebook/callback
    ↓
Server validates Facebook token
    ↓
Create/Update user in database
    ↓
Generate JWT token
    ↓
Redirect to client with token in URL params
    ↓
Client saves token and user info
    ↓
Navigate to home/admin page based on role
```

## 📚 API Endpoints

### GET /auth/facebook

Initiates Facebook OAuth flow

**Response**: Redirect to Facebook login

---

### GET /auth/facebook/callback

Handles Facebook OAuth callback

**Query Params**:

- `code`: Authorization code from Facebook

**Response**: Redirect to client with token

```
http://localhost:3000?token=<jwt_token>&role=<user_role>
```

## 🎯 Next Steps

Các cải tiến có thể thực hiện:

1. **Email Requirement**: Bắt buộc email nếu Facebook không cung cấp
2. **Profile Sync**: Tự động cập nhật avatar từ Facebook
3. **Unlink Account**: Cho phép user hủy liên kết Facebook
4. **Multiple OAuth**: Liên kết nhiều OAuth providers cho cùng một account
5. **Error Handling**: UI thân thiện hơn cho các lỗi OAuth

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Check server logs
2. Check browser console
3. Verify Facebook App settings
4. Check database for user creation
5. Test với Facebook Test User

## 📄 License

MIT License - Free to use for development and production.
