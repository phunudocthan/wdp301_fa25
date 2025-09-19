Tạo cái .env như dưới, port muốn nhiêu cũng được

PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key-here-replace-this-in-production

MONGODB_URI=mongodb+srv://ce181888:YMbtfgThORwtayON@wdp301.cb1lsot.mongodb.net/?retryWrites=true&w=majority&appName=WDP301
DB_NAME=lego_ecommerce

# Client URL for CORS
CLIENT_URL=http://localhost:3000

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

