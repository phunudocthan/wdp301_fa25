# LEGO E-commerce - Setup nhanh

Tạo file `server/.env` với nội dung mẫu dưới đây (có thể đổi port tùy ý):

```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-here-replace-this-in-production

MONGODB_URI=mongodb+srv://ce181888:YMbtfgThORwtayON@wdp301.cb1lsot.mongodb.net/?retryWrites=true&w=majority&appName=WDP301
DB_NAME=lego_ecommerce

# Client URL for CORS
CLIENT_URL=http://localhost:3000

2. Cài dependencies:
   - Frontend: `cd client && npm install`
   - Backend: `cd server && npm install`

3. Chay project:
   - Frontend: `npm run dev`
   - Backend: `npm run dev`

## Cay thu muc hien tai

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

(*Bo qua `node_modules/` de giam nhiu do dai*)

## Luu y nhanh
- Giu lai cac file `.gitkeep` trong thu muc rong de git track.
- Khi thu muc da co ma nguon thi co the xoa `.gitkeep` neu muon.
- Cap nhat `PROJECT_STRUCTURE.md` neu thay doi lon ve cay thu muc.
=======
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

>>>>>>> d742891199b2a1a47b8d8a4d9fb101ae97ecb71a
