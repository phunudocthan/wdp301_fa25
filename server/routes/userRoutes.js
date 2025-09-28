const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  listAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  archiveAddress,
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

router.get('/profile', requireAuth, getProfile);
router.patch('/profile', requireAuth, updateProfile);
router.put('/avatar', requireAuth, upload.single('avatar'), updateAvatar);
router.put('/password', requireAuth, changePassword);
router.get('/addresses', requireAuth, listAddresses);
router.post('/addresses', requireAuth, createAddress);
router.put('/addresses/:addressId', requireAuth, updateAddress);
router.patch('/addresses/:addressId/default', requireAuth, setDefaultAddress);
router.delete('/addresses/:addressId', requireAuth, archiveAddress);

module.exports = router;
