# 🧱 LEGO E-commerce System

Hệ thống thương mại điện tử LEGO được phát triển theo mô hình 4 Sprint với đầy đủ tính năng từ authentication đến AI chatbot.

## 🏗️ Cấu trúc dự án

```
WDP310_FA25/
├── client/          # ReactJS + TypeScript + Vite
├── server/          # ExpressJS + MongoDB + Mongoose
├── .gitignore
└── README.md
```

## 🚀 Hướng dẫn chạy dự án

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Git

### 1. Clone repository
```bash
git clone https://github.com/phunudocthan/wdp301_fa25.git
cd wdp301_fa25
```

### 2. Cấu hình Server
```bash
cd server
npm install
```

Tạo file `.env` với nội dung:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-here
MONGODB_URI=mongodb+srv://annpce181888:YOUR_PASSWORD_HERE@wdp301.cb1lsot.mongodb.net/?retryWrites=true&w=majority&appName=WDP301
DB_NAME=lego_ecommerce
CLIENT_URL=http://localhost:3000
```

Chạy server:
```bash
npm run dev
```

### 3. Cấu hình Client
```bash
cd ../client
npm install
```

Chạy client:
```bash
npm run dev
```

### 4. Test kết nối
- Server: http://localhost:5000/api/test
- Client: http://localhost:3000
- Health check: http://localhost:5000/api/health

## 📊 Database Schema

### Collections chính:
- `users` - Quản lý người dùng (customer/seller/admin)
- `legos` - Sản phẩm LEGO
- `themes` - Chủ đề LEGO (Star Wars, Technic...)
- `orders` - Đơn hàng
- `reviews` - Đánh giá sản phẩm
- `galleries` - Cộng đồng chia sẻ

## 🛠️ Tech Stack

### Frontend
- **React 18** với TypeScript
- **Vite** - Build tool nhanh
- **Axios** - HTTP client
- CSS3 với gradient và backdrop-filter

### Backend
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Sprint Planning

### Sprint 1: Authentication & Basic Setup ✅
- [x] Project structure setup
- [x] MongoDB Atlas connection
- [x] Basic user model
- [ ] User registration/login
- [ ] Email verification
- [ ] Role-based access

### Sprint 2: LEGO Product Management
- [ ] CRUD sản phẩm LEGO
- [ ] Quản lý themes, age ranges, difficulties
- [ ] Upload images
- [ ] Search & filter
- [ ] Homepage sections

### Sprint 3: Cart, Orders & Payment
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] COD & VNPay payment
- [ ] Order management
- [ ] Voucher system

### Sprint 4: Review, Community & AI Chat
- [ ] Product reviews
- [ ] Community gallery
- [ ] AI chatbot
- [ ] Admin dashboard

## 👥 Team Members

### Dev 1 - Authentication & User Management
- Backend: Auth APIs, JWT middleware
- Frontend: Login/Register forms, Profile
- Database: `users`

### Dev 2 - LEGO Product Management + Homepage
- Backend: LEGO CRUD, Search/Filter APIs
- Frontend: Product pages, Homepage
- Database: `legos`, `themes`, `ageRanges`, `difficulties`

### Dev 3 - Cart & Orders
- Backend: Cart API, Order processing
- Frontend: Cart, Checkout pages
- Database: `orders`, cart logic

### Dev 4 - Payment, Vouchers & Revenue
- Backend: VNPay integration, Analytics
- Frontend: Payment flow, Reports
- Database: `vouchers`, payment processing

### Dev 5 - Review, Gallery & AI Chat
- Backend: Review API, Chatbot API
- Frontend: Review components, Chat widget
- Database: `reviews`, `galleries`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập  
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Thông tin user

### LEGO Products
- `GET /api/legos` - Danh sách sản phẩm
- `GET /api/legos/:id` - Chi tiết sản phẩm
- `POST /api/legos` - Tạo sản phẩm (seller)
- `PUT /api/legos/:id` - Cập nhật sản phẩm
- `DELETE /api/legos/:id` - Xóa sản phẩm (soft delete)

### Orders
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái

## 🌟 Features

### Khách hàng (Customer)
- ✅ Đăng ký/Đăng nhập (email, Google OAuth)
- 🔄 Browse/search/filter sản phẩm LEGO
- 🔄 Thêm vào giỏ hàng, đặt hàng
- 🔄 Thanh toán COD/VNPay
- 🔄 Review sản phẩm, tham gia cộng đồng
- 🔄 Chat với AI bot

### Người bán (Seller)
- 🔄 Quản lý sản phẩm LEGO (CRUD)
- 🔄 Quản lý đơn hàng
- 🔄 Thống kê doanh thu

### Quản trị viên (Admin)
- 🔄 Quản lý người dùng
- 🔄 Quản lý themes, age ranges
- 🔄 Dashboard tổng quan
- 🔄 Kiểm duyệt reviews/gallery

## 🔐 Security Features

- JWT Authentication
- Password hashing (bcryptjs)
- Role-based access control
- Input validation
- CORS protection
- Rate limiting (sẽ thêm)

## 📱 Responsive Design

- Mobile-first approach
- Flexbox & Grid layout
- Modern CSS với backdrop-filter
- Progressive Web App ready

## 🤖 AI Chatbot Features

- FAQ tự động
- Gợi ý sản phẩm LEGO theo tuổi/độ khó
- Tracking đơn hàng
- Escalate to human support

---

**Liên hệ:** [GitHub Repository](https://github.com/phunudocthan/wdp301_fa25.git)
