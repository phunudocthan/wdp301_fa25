const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const Voucher = require('../models/Voucher');

// Admin-only voucher management
router.get('/admin', requireAuth, requireRole('admin'), voucherController.listVouchers);
router.get('/admin/:id', requireAuth, requireRole('admin'), voucherController.getVoucher);
router.post('/admin', requireAuth, requireRole('admin'), voucherController.createVoucher);
router.put('/admin/:id', requireAuth, requireRole('admin'), voucherController.updateVoucher);
router.delete('/admin/:id', requireAuth, requireRole('admin'), voucherController.deleteVoucher);
router.patch('/admin/:id/status', requireAuth, requireRole('admin'), voucherController.updateVoucherStatus);

// Validate voucher by code
router.get('/validate', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const v = await Voucher.findOne({ code: String(code).toUpperCase().trim() });
    if (!v) return res.status(404).json({ valid: false, message: 'Voucher not found' });
    if (v.status !== 'active') return res.status(400).json({ valid: false, message: 'Voucher not active' });
    if (new Date() > v.expiryDate) return res.status(400).json({ valid: false, message: 'Voucher expired' });
    return res.json({ valid: true, id: v._id, code: v.code, discountPercent: v.discountPercent, usageLimit: v.usageLimit });
  } catch (err) {
    console.error('Voucher validate error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: Get all active vouchers (for homepage, no token required)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      status: 'active',
      expiryDate: { $gte: now }
    }).sort({ expiryDate: 1 });
    res.json({ success: true, data: vouchers });
  } catch (err) {
    console.error('Voucher active error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
