const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvatar, changePassword } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../utils/multerConfig');

// Routes của Huy
router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.put('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);
router.put('/password', authMiddleware, changePassword);

module.exports = router;
