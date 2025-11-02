# Fix: "Route not found" khi Login with Facebook

## 🔴 Vấn Đề

Khi click nút "Continue with Facebook", bạn nhận được lỗi:

```json
{ "message": "Route not found" }
```

## 🔍 Nguyên Nhân

Có 3 nguyên nhân chính:

### 1. **Facebook credentials chưa được cấu hình**

File `.env` chưa có hoặc thiếu:

- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_CALLBACK_URL`

### 2. **Server chưa được restart sau khi thêm config**

Server cần restart để load biến môi trường mới từ `.env`

### 3. **URL không đúng format**

Client đang gọi `/auth/facebook` nhưng server mount ở `/api/auth`

## ✅ Giải Pháp

### Bước 1: Kiểm tra file `.env`

Mở `server/.env` và đảm bảo có các dòng sau:

```env
# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

**Lưu ý**:

- Thay `your_facebook_app_id_here` bằng App ID thật từ Facebook Developers
- Thay `your_facebook_app_secret_here` bằng App Secret thật

### Bước 2: Tạo Facebook App (Nếu chưa có)

1. Truy cập: https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Chọn **"Consumer"**
4. Điền thông tin app
5. Sau khi tạo, vào **"Settings"** → **"Basic"**
6. Copy **App ID** và **App Secret**

### Bước 3: Cấu hình Facebook App

Trong Facebook App Settings:

1. **Add Facebook Login Product**

   - Click **"Add Product"**
   - Chọn **"Facebook Login"**

2. **Configure Valid OAuth Redirect URIs**

   - Vào **"Facebook Login"** → **"Settings"**
   - Thêm vào **"Valid OAuth Redirect URIs"**:
     ```
     http://localhost:5000/auth/facebook/callback
     http://localhost:5000/api/auth/facebook/callback
     ```

3. **Configure App Domains**
   - Vào **"Settings"** → **"Basic"**
   - Thêm **App Domains**: `localhost`

### Bước 4: Restart Server

**Option A: Sử dụng PowerShell script** (Khuyến nghị)

```powershell
.\start-server-facebook.ps1
```

**Option B: Manual**

```bash
# Stop all Node processes
Get-Process -Name node | Stop-Process -Force

# Start server
cd server
npm start
```

**Option C: Sử dụng nodemon**

```bash
cd server
nodemon index.js
```

### Bước 5: Verify Routes

Sau khi server khởi động, bạn sẽ thấy:

```
Server running on port 5000
API URL: http://localhost:5000/api
```

**Test routes có hoạt động chưa:**

1. Mở browser và truy cập:

   ```
   http://localhost:5000/auth/facebook
   ```

   hoặc

   ```
   http://localhost:5000/api/auth/facebook
   ```

2. Bạn sẽ được redirect đến Facebook login page

3. Nếu thấy trang Facebook login → ✅ Routes đã hoạt động!

4. Nếu vẫn thấy "Route not found" → ❌ Kiểm tra lại các bước

### Bước 6: Test từ Client

1. Vào trang login: `http://localhost:3000/login`
2. Click nút **"Continue with Facebook"**
3. Đăng nhập Facebook
4. Authorize app
5. Bạn sẽ được redirect về trang chủ với token

## 🧪 Debug Tools

### Test Script #1: Check Routes

```bash
node test-facebook-route.js
```

### Test Script #2: Check Environment

```bash
cd server
node test-facebook-auth.js
```

### Manual curl test

```bash
curl -I http://localhost:5000/auth/facebook
```

Nếu thành công, bạn sẽ thấy:

```
HTTP/1.1 302 Found
Location: https://www.facebook.com/v18.0/dialog/oauth?...
```

## 🔧 Troubleshooting

### Lỗi: "FACEBOOK_AUTH_ENABLED is false"

**Nguyên nhân**: Server không phát hiện Facebook credentials

**Giải pháp**:

1. Kiểm tra `.env` có đầy đủ 3 biến: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
2. Restart server
3. Check console log khi server start

### Lỗi: "Port 5000 already in use"

**Giải pháp**:

```powershell
# Kill all Node processes
Get-Process -Name node | Stop-Process -Force

# Or kill specific port
netstat -ano | findstr :5000
# Tìm PID rồi:
taskkill /PID <process_id> /F
```

### Lỗi: "Cannot GET /auth/facebook"

**Nguyên nhân**: Routes chưa được mount

**Giải pháp**:

1. Kiểm tra `server/index.js` có dòng:
   ```javascript
   app.use("/auth", authRoutes);
   ```
2. Restart server

### Lỗi: "App Not Setup: This app is still in development mode"

**Nguyên nhân**: Facebook App chưa được public

**Giải pháp**:

- **Development**: Thêm tài khoản Facebook của bạn vào **"Roles"** → **"Test Users"** hoặc **"Developers"**
- **Production**: Submit app review và chuyển sang Live Mode

### Lỗi: "Given URL is not allowed by the Application configuration"

**Nguyên nhân**: Callback URL không match với cấu hình

**Giải pháp**:

1. Vào Facebook App → **"Facebook Login"** → **"Settings"**
2. Check **"Valid OAuth Redirect URIs"**
3. Đảm bảo có: `http://localhost:5000/api/auth/facebook/callback`

## 📝 Checklist

- [ ] File `.env` có đầy đủ Facebook credentials
- [ ] Facebook App đã được tạo
- [ ] OAuth Redirect URIs đã được cấu hình
- [ ] Server đã được restart sau khi cập nhật .env
- [ ] Port 5000 không bị chiếm bởi process khác
- [ ] Routes `/auth/facebook` hoặc `/api/auth/facebook` trả về 302 redirect
- [ ] Browser có thể truy cập Facebook login page
- [ ] Client đang chạy ở port 3000

## 🎯 Expected Flow

```
User clicks "Continue with Facebook"
    ↓
Browser navigates to: http://localhost:5000/auth/facebook
    ↓
Server (302) redirects to: https://www.facebook.com/v18.0/dialog/oauth?...
    ↓
User logs in on Facebook
    ↓
Facebook (302) redirects to: http://localhost:5000/api/auth/facebook/callback?code=...
    ↓
Server creates/updates user, generates JWT
    ↓
Server (302) redirects to: http://localhost:3000?token=...&role=...
    ↓
Client saves token, navigates to home/admin
    ↓
Success! ✅
```

## 📞 Vẫn Gặp Lỗi?

1. **Check server logs**: Console sẽ hiển thị lỗi chi tiết
2. **Check browser console**: F12 → Network tab → xem request nào fail
3. **Verify .env**: `Get-Content server\.env | Select-String FACEBOOK`
4. **Test routes**: Dùng script hoặc curl
5. **Check Facebook App status**: Developer dashboard

## 🚀 Quick Start (All-in-One)

```powershell
# 1. Add Facebook credentials to .env
# 2. Run this script
.\start-server-facebook.ps1

# 3. In another terminal, start client
cd client
npm run dev

# 4. Open browser
# http://localhost:3000/login

# 5. Click "Continue with Facebook"
```

Xong! 🎉
