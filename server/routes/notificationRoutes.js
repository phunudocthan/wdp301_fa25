const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  listNotifications,
  markNotificationRead,
  getNotificationDetail,
  adminListSentNotifications,
  adminCreateNotification,
  adminUpdateNotification,
  adminDeleteNotification,
  adminRestoreNotification,
} = require('../controllers/notificationController');


router.get('/', requireAuth, listNotifications);
router.get('/:notificationId', requireAuth, getNotificationDetail);
router.patch('/:notificationId/read', requireAuth, markNotificationRead);

// Admin notification APIs (chỉ giữ lại các route còn handler)
router.get('/admin/sent', requireAuth, requireRole('admin'), adminListSentNotifications);
router.post('/admin', requireAuth, requireRole('admin'), adminCreateNotification);
router.patch('/admin/:notificationId', requireAuth, requireRole('admin'), adminUpdateNotification);
router.delete('/admin/:notificationId', requireAuth, requireRole('admin'), adminDeleteNotification);
router.post('/admin/:notificationId/restore', requireAuth, requireRole('admin'), adminRestoreNotification);

module.exports = router;
