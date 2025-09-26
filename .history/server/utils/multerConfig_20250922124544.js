const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục tồn tại
const uploadDir = 'uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return cb(new Error('Only images are allowed (jpg, jpeg, png)'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
