# 🚀 Hướng dẫn Setup cho Team

## 📥 Bước 1: Pull code mới nhất

```bash
git checkout develop
git pull origin develop
```

## 🔧 Bước 2: Setup môi trường

### Backend Setup:

```bash
cd server
npm install
```

### Frontend Setup:

```bash
cd client
npm install
```

## 🗄️ Bước 3: Cấu hình Database

Tạo file `server/.env` với nội dung:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-here-replace-this-in-production

MONGODB_URI=mongodb+srv://ce181888:YMbtfgThORwtayON@wdp301.cb1lsot.mongodb.net/?retryWrites=true&w=majority&appName=WDP301
DB_NAME=lego_ecommerce

CLIENT_URL=http://localhost:3000
```

## 🌱 Bước 4: Seed Database (chỉ cần chạy 1 lần)

```bash
cd server
node seedDatabase.js
```

## ▶️ Bước 5: Chạy Project

### Chạy Backend (Terminal 1):

```bash
cd server
npm start
# Server sẽ chạy trên http://localhost:5000
```

### Chạy Frontend (Terminal 2):

```bash
cd client
npm run dev
# Frontend sẽ chạy trên http://localhost:3001 (hoặc port khác nếu 3000 đã dùng)
```

## ✅ Kiểm tra hoạt động

1. **Backend**: Truy cập http://localhost:5000/api/health
2. **Frontend**: Truy cập http://localhost:3001 (hoặc port hiển thị trong terminal)
3. **Database**: Kiểm tra kết nối qua API http://localhost:5000/api/database/stats

## 📋 Cấu trúc Project hiện tại

```
WDP310_FA25/
├── client/          # React Frontend
│   ├── src/
│   │   ├── components/  # Thư mục cho components
│   │   ├── pages/       # Thư mục cho pages
│   │   ├── services/    # API calls
│   │   └── utils/       # Utility functions
│   └── ...
├── server/          # Express Backend
│   ├── models/          # MongoDB models (đã hoàn thiện)
│   ├── controllers/     # Route handlers (chưa có - cần implement)
│   ├── middleware/      # Authentication, validation, etc.
│   ├── config/          # Database config
│   └── utils/           # Helper functions
└── ...
```

## 🎯 Tasks có thể bắt đầu ngay

### Frontend Tasks:

- Tạo các components UI (Header, Footer, ProductCard, etc.)
- Implement routing với React Router
- Tạo các pages (Home, Products, Login, Register, etc.)
- Setup state management (Context API hoặc Redux)

### Backend Tasks:

- Implement Authentication controllers
- Tạo CRUD operations cho Products
- Implement Order management
- Setup middleware cho authentication/authorization

## 📊 Database đã có sẵn:

- **Users**: 4 users (admin, seller, 2 customers)
- **Products**: 3 LEGO sets
- **Categories**: Themes, Age ranges, Difficulties
- **Orders, Reviews, Vouchers**: Sample data
- **Password mặc định**: `123456` cho tất cả users

## 🔧 Development Workflow:

1. Tạo feature branch từ develop: `git checkout -b feature/ten-feature`
2. Implement feature
3. Test local
4. Push và tạo Pull Request về develop
5. Review và merge

## 🆘 Troubleshooting:

- **Lỗi MongoDB**: Kiểm tra IP whitelist trong MongoDB Atlas
- **Port conflict**: Đổi port trong file cấu hình
- **Dependencies**: Xóa node_modules và chạy lại npm install

---

**Happy Coding! 🎉**
