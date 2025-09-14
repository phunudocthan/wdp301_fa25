# 🧪 Hướng dẫn Test Kết nối

## 📋 Checklist trước khi test

### 1. Cấu hình MongoDB Atlas
- [ ] Đã tạo account MongoDB Atlas
- [ ] Đã tạo cluster và database
- [ ] Đã thêm IP address vào whitelist
- [ ] Đã tạo user với quyền read/write

### 2. Cập nhật file .env
```bash
cd server
```

Chỉnh sửa file `.env` (thay YOUR_PASSWORD_HERE bằng password thật):
```env
MONGODB_URI=mongodb+srv://annpce181888:YOUR_REAL_PASSWORD@wdp301.cb1lsot.mongodb.net/?retryWrites=true&w=majority&appName=WDP301
```

### 3. Cài đặt dependencies (nếu chưa)
```bash
# Server
cd server
npm install

# Client  
cd ../client
npm install
```

## 🚀 Chạy và test dự án

### Bước 1: Start Server
```bash
cd server
npm run dev
```

**Kết quả mong đợi:**
```
🚀 Server running on port 5000
✅ MongoDB Atlas connected successfully
📦 Database: lego_ecommerce
🌐 API URL: http://localhost:5000/api
🔍 Test endpoint: http://localhost:5000/api/test
💚 Health check: http://localhost:5000/api/health
```

### Bước 2: Test API endpoints

#### 2.1 Test basic connection
```bash
# Hoặc mở browser và vào:
http://localhost:5000/api/test
```

**Response mong đợi:**
```json
{
  "message": "LEGO E-commerce API is running!",
  "timestamp": "2025-09-15T04:55:00.000Z",
  "database": "Connected"
}
```

#### 2.2 Health check
```bash
http://localhost:5000/api/health
```

**Response mong đợi:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-15T04:55:00.000Z",
  "database": {
    "status": "Connected",
    "name": "lego_ecommerce"
  },
  "server": {
    "uptime": 123.456,
    "memory": {...},
    "version": "v18.x.x"
  }
}
```

### Bước 3: Start Client (Terminal mới)
```bash
cd client
npm run dev
```

**Kết quả mong đợi:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Bước 4: Test Frontend
Mở browser và vào: http://localhost:3000

**Giao diện mong đợi:**
- Tiêu đề: "🧱 LEGO E-commerce System"
- Phần "📡 Trạng thái kết nối" hiển thị: "✅ Kết nối thành công!"
- Thông tin server và database
- Grid 4 tính năng chính
- Danh sách API endpoints

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```
❌ MongoDB connection error: MongoServerError: Authentication failed
```

**Giải pháp:**
1. Kiểm tra username/password trong connection string
2. Đảm bảo IP được whitelist trong MongoDB Atlas
3. Kiểm tra network restrictions

### Lỗi server không start
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Giải pháp:**
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr 5000

# Kill process (thay PID bằng số thật)
taskkill /PID <PID> /F
```

### Client không kết nối được API
```
❌ Không thể kết nối với server
```

**Giải pháp:**
1. Đảm bảo server đang chạy trên port 5000
2. Kiểm tra proxy config trong `vite.config.ts`
3. Disable firewall/antivirus tạm thời

## 🎯 Testing Advanced Features

### Test Database Operations
```javascript
// Thêm vào server/index.js để test
app.get('/api/test-db', async (req, res) => {
  try {
    const User = require('./models/User');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com', 
      password: 'hashedpassword'
    });
    
    await testUser.save();
    res.json({ message: 'Database write test successful!', user: testUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Test với Postman/Thunder Client
```
GET http://localhost:5000/api/test
GET http://localhost:5000/api/health
GET http://localhost:5000/api/test-db
```

## ✅ Test hoàn thành khi:

- [x] Server start thành công và kết nối MongoDB
- [x] Endpoint `/api/test` trả về response đúng
- [x] Health check `/api/health` hiển thị database Connected
- [x] Client chạy trên port 3000
- [x] Frontend hiển thị "✅ Kết nối thành công!"
- [x] Proxy từ client sang server hoạt động
- [x] Có thể create/read data từ MongoDB (optional)

## 🎉 Sau khi test thành công

Bạn có thể bắt đầu phát triển các tính năng trong Sprint 1:
1. User registration/login
2. JWT authentication
3. Role-based access control
4. Email verification
5. Password reset

**Happy coding! 🚀**
