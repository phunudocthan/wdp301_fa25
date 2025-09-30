const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvatar, changePassword } = require('../controllers/userController');
const { requireAuth} = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

// Routes của Huy
router.get('/profile', requireAuth, getProfile); 
router.patch('/profile', requireAuth, updateProfile);
router.put('/avatar', requireAuth, upload.single('avatar'), updateAvatar);
router.put('/password', requireAuth, changePassword);

module.exports = router;
