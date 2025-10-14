const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');

// Validate voucher by code
router.get('/validate', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const v = await Voucher.findOne({ code: String(code).toUpperCase().trim() });
    if (!v) return res.status(404).json({ valid: false, message: 'Voucher not found' });
    if (v.status !== 'active') return res.status(400).json({ valid: false, message: 'Voucher not active' });
    if (new Date() > v.expiryDate) return res.status(400).json({ valid: false, message: 'Voucher expired' });
    return res.json({ valid: true, code: v.code, discountPercent: v.discountPercent, usageLimit: v.usageLimit });
  } catch (err) {
    console.error('Voucher validate error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
