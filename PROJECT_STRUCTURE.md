# Cau truc thu muc du an LEGO E-commerce

## 1. Cau truc hien tai

```
WDP310_FA25/
|- client/
|  |- public/
|  |- src/
|  |  |- components/
|  |  |  `- .gitkeep
|  |  |- pages/
|  |  |  `- .gitkeep
|  |  |- services/
|  |  |  `- .gitkeep
|  |  |- utils/
|  |  |  `- .gitkeep
|  |  |- App.tsx
|  |  |- App.css
|  |  |- index.css
|  |  `- main.tsx
|  |- index.html
|  |- package.json
|  |- package-lock.json
|  |- tsconfig.json
|  |- tsconfig.node.json
|  `- vite.config.ts
|
|- server/
|  |- config/
|  |  `- .gitkeep
|  |- controllers/
|  |  `- .gitkeep
|  |- middleware/
|  |  `- .gitkeep
|  |- models/
|  |- routes/
|  |- services/
|  |  `- .gitkeep
|  |- utils/
|  |  `- .gitkeep
|  |- index.js
|  |- package.json
|  |- package-lock.json
|  |- seedDatabase.js
|  `- .env
|
|- LEGOs_Project_Plan_Four_Sprint.markdown
|- PROJECT_STRUCTURE.md
|- README.md
`- .gitignore
```

(Luu y: bo qua `node_modules/` de giu tai lieu gon gang.)

## 2. Quy tac dat ten

### Frontend (`client/`)
- **Components:** PascalCase - `UserProfile.tsx`, `LegoCard.tsx`
- **Pages:** PascalCase - `LoginPage.tsx`, `HomePage.tsx`
- **Services:** camelCase - `authService.ts`, `legoService.ts`
- **Utils:** camelCase - `validation.ts`, `formatters.ts`
- **Hooks/Context (neu co):** camelCase + hau to phu hop - `useAuth.ts`, `cartContext.ts`

### Backend (`server/`)
- **Controllers:** camelCase + `Controller` - `authController.js`, `legoController.js`
- **Routes:** camelCase + `Routes` - `authRoutes.js`, `legoRoutes.js`
- **Models:** PascalCase - `User.js`, `Lego.js`
- **Services:** camelCase + `Service` - `emailService.js`, `paymentService.js`
- **Middleware:** camelCase - `auth.js`, `validation.js`
- **Utils:** camelCase - `generateOtp.js`, `encrypt.js`
- **Seeder/Script:** camelCase - `seedDatabase.js`

## 3. Khi nao tao thu muc/file moi?

### Tao ngay khi can
```bash
# Vi du Dev 1 lam Authentication
server/
|- controllers/
|  `- authController.js      # Logic dang ky/dang nhap
|- routes/
|  `- authRoutes.js          # API endpoints
|- middleware/
|  `- auth.js                # JWT middleware
|- services/
|  `- emailService.js        # Goi email verification

client/
|- src/
|  |- components/
|  |  `- LoginForm.tsx       # Form dang nhap
|  |- pages/
|  |  `- LoginPage.tsx       # Trang dang nhap
|  `- services/
|     `- authService.ts      # API calls cho auth
```

### Vi du cac dev khac
- **Dev 2 - LEGO Management**
  - `server/controllers/legoController.js`
  - `server/routes/legoRoutes.js`
  - `client/src/components/LegoCard.tsx`
  - `client/src/pages/LegoListPage.tsx`
  - `client/src/services/legoService.ts`
- **Dev 3 - Orders**
  - `server/controllers/orderController.js`
  - `server/routes/orderRoutes.js`
  - `client/src/components/CartItem.tsx`
  - `client/src/pages/CheckoutPage.tsx`
  - `client/src/services/orderService.ts`

## 4. Luu y quan trong
1. **Khong tao truoc:** Chi tao file/folder khi thuc su can, nhung giu san thu muc rong bang `.gitkeep` de dong bo git.
2. **Dat ten nhat quan:** Theo conventions o tren.
3. **Import/Export dung:** Su dung ES6 modules, tranh default export khong can thiet.
4. **Comment code:** Chi comment cac doan logic phuc tap.
5. **Git branch:** Moi feature mot branch rieng, nho rebase/squash truoc khi merge.

## 5. Muc tieu
- **De tim kiem:** Ai cung biet file nam o dau.
- **De bao tri:** Cau truc ro rang, tranh xao tron logic.
- **De mo rong:** Co san thu muc cho cac module lon, de feature moi dua vao nhanh.
- **Team work:** Moi thanh vien theo cung mot khuon mau.

---

**Note:** Cap nhat file nay ngay khi cau truc thay doi lon hoac co folder quan trong moi.
