# 📂 Cấu trúc thư mục dự án LEGO E-commerce

## 🏗️ Cấu trúc hiện tại

```
WDP310_FA25/
├── client/                
│   ├── src/
│   │   ├── components/     
│   │   ├── pages/          
│   │   ├── services/       # API calls (tạo khi cần)
│   │   ├── utils/          # Helper functions (tạo khi cần)
│   │   ├── App.tsx         
│   │   ├── App.css         
│   │   ├── main.tsx       
│   │   └── index.css       
│   ├── public/             
│   ├── index.html          
│   ├── package.json        
│   ├── tsconfig.json      
│   └── vite.config.ts      
│
├── server/                
│   ├── controllers/       
│   ├── routes/             
│   ├── middleware/         
│   ├── services/          
│   ├── utils/              
│   ├── config/             
│   ├── models/            
│   │   ├── User.js        
│   │   ├── Lego.js                 
│   │   ├── Order.js        
│   │   └── Theme.js        
│   ├── index.js            
│   ├── package.json        
│   └── .env                
│
├── .gitignore              
├── README.md              

```

## 📋 Quy tắc đặt tên

### **Frontend (client/)**

- **Components:** PascalCase - `UserProfile.tsx`, `LegoCard.tsx`
- **Pages:** PascalCase - `LoginPage.tsx`, `HomePage.tsx`
- **Services:** camelCase - `authService.ts`, `legoService.ts`
- **Utils:** camelCase - `validation.ts`, `formatters.ts`

### **Backend (server/)**

- **Controllers:** camelCase + Controller - `authController.js`, `legoController.js`
- **Routes:** camelCase + Routes - `authRoutes.js`, `legoRoutes.js`
- **Models:** PascalCase - `User.js`, `Lego.js`
- **Services:** camelCase + Service - `emailService.js`, `paymentService.js`
- **Middleware:** camelCase - `auth.js`, `validation.js`

## 🚀 Khi nào tạo thư mục/file mới?

### **Tạo ngay khi cần:**

```bash
# Ví dụ Dev 1 làm Authentication:
server/
├── controllers/
│   └── authController.js    # Logic đăng ký/đăng nhập
├── routes/
│   └── authRoutes.js        # API endpoints
├── middleware/
│   └── auth.js              # JWT middleware
└── services/
    └── emailService.js      # Gửi email verification

client/
├── src/
│   ├── components/
│   │   ├── LoginForm.tsx    # Form đăng nhập
│   │   └── RegisterForm.tsx # Form đăng ký
│   ├── pages/
│   │   ├── LoginPage.tsx    # Trang đăng nhập
│   │   └── RegisterPage.tsx # Trang đăng ký
│   └── services/
       └── authService.ts    # API calls cho auth
```

### **Ví dụ các dev khác:**

**Dev 2 - LEGO Management:**

```
server/controllers/legoController.js
server/routes/legoRoutes.js
client/src/components/LegoCard.tsx
client/src/pages/LegoListPage.tsx
client/src/services/legoService.ts
```

**Dev 3 - Orders:**

```
server/controllers/orderController.js
server/routes/orderRoutes.js
client/src/components/CartItem.tsx
client/src/pages/CheckoutPage.tsx
client/src/services/orderService.ts
```

## 📝 Lưu ý quan trọng

1. **Không tạo trước:** Chỉ tạo file/folder khi thực sự cần
2. **Đặt tên nhất quán:** Theo convention đã định
3. **Import/Export đúng:** Sử dụng ES6 modules
4. **Comment code:** Giải thích logic phức tạp
5. **Git branch:** Mỗi feature một branch riêng

## 🎯 Mục tiêu

- **Dễ tìm kiếm:** Biết file nằm ở đâu
- **Dễ bảo trì:** Cấu trúc rõ ràng
- **Dễ mở rộng:** Thêm feature mới dễ dàng
- **Team work:** Mọi người làm theo cùng chuẩn

---

**Lưu ý:** File này sẽ được cập nhật khi có thay đổi lớn về cấu trúc!
