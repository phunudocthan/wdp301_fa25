const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Admin-only voucher management
router.get('/admin', requireAuth, requireRole('admin'), voucherController.listVouchers);
router.get('/admin/:id', requireAuth, requireRole('admin'), voucherController.getVoucher);
router.post('/admin', requireAuth, requireRole('admin'), voucherController.createVoucher);
router.put('/admin/:id', requireAuth, requireRole('admin'), voucherController.updateVoucher);
router.delete('/admin/:id', requireAuth, requireRole('admin'), voucherController.deleteVoucher);
router.patch('/admin/:id/status', requireAuth, requireRole('admin'), voucherController.updateVoucherStatus);

module.exports = router;
