# Facebook Login - Quick Setup

## ⚡ Cài Đặt Nhanh

### 1. Cài Đặt Dependencies

```bash
cd server
npm install passport-facebook
```

✅ **Đã hoàn tất!**

### 2. Tạo Facebook App

1. Truy cập: https://developers.facebook.com/
2. Create New App → Consumer
3. Add "Facebook Login" product
4. Copy **App ID** và **App Secret**

### 3. Cấu Hình .env

Thêm vào `server/.env`:

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5001/auth/facebook/callback
```

### 4. Cấu Hình Facebook App Settings

- **Valid OAuth Redirect URIs**: `http://localhost:5001/auth/facebook/callback`
- **App Domains**: `localhost`
- **Site URL**: `http://localhost:3000`

### 5. Chạy Server

```bash
cd server
npm run dev
```

### 6. Test

1. Vào `http://localhost:3000/login`
2. Click "Continue with Facebook"
3. Đăng nhập thành công! 🎉

## 📋 Checklist

- [x] Backend: Cài đặt passport-facebook
- [x] Backend: Thêm Facebook Strategy
- [x] Backend: Thêm routes /auth/facebook
- [x] Backend: Cập nhật User model với facebookId
- [x] Frontend: Thêm nút Facebook login
- [x] Frontend: Xử lý OAuth callback
- [ ] Tạo Facebook App
- [ ] Cấu hình .env với Facebook credentials
- [ ] Test login flow

## 📚 Tài Liệu Chi Tiết

Xem file `FACEBOOK_LOGIN_GUIDE.md` để biết thêm chi tiết về:

- Cấu hình Facebook App từng bước
- Troubleshooting các lỗi thường gặp
- Database schema
- Security best practices
- Production deployment

## 🔑 Các Biến Môi Trường

```env
# Required
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_CALLBACK_URL=http://localhost:5001/auth/facebook/callback

# Also Required (should already exist)
JWT_SECRET=xxx
SESSION_SECRET=xxx
CLIENT_URL=http://localhost:3000
```

## 🚀 Tính Năng

- ✅ Login với Facebook account
- ✅ Tự động tạo user mới hoặc link với account có sẵn
- ✅ Sync avatar từ Facebook
- ✅ Activity logging
- ✅ Auto redirect theo role (admin/customer)
- ✅ JWT token authentication

## 📞 Cần Hỗ Trợ?

1. Kiểm tra `FACEBOOK_LOGIN_GUIDE.md` - Troubleshooting section
2. Check server logs: Console có thông báo lỗi chi tiết
3. Verify Facebook App settings
4. Test với Facebook Test User

Happy coding! 🎉
