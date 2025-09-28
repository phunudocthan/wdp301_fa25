const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  listNotifications,
  createNotification,
  markNotificationRead,
} = require('../controllers/notificationController');

router.get('/', requireAuth, listNotifications);
router.post('/', requireAuth, createNotification);
router.patch('/:notificationId/read', requireAuth, markNotificationRead);

module.exports = router;
