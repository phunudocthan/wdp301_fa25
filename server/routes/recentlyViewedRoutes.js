const express = require('express');
const router = express.Router();
const RecentlyViewed = require('../models/RecentlyViewed');
const Lego = require('../models/Lego');
const { requireAuth } = require('../middleware/authMiddleware');

// Lưu sản phẩm đã xem (user)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { legoId } = req.body;
    if (!legoId) return res.status(400).json({ error: 'Missing legoId' });
    let doc = await RecentlyViewed.findOne({ userId });
    if (!doc) {
      doc = await RecentlyViewed.create({ userId, legoIds: [legoId] });
    } else {
      // Thêm vào đầu, xóa trùng, giới hạn 20 sản phẩm
      const ids = [legoId, ...doc.legoIds.filter(id => id.toString() !== legoId)];
      doc.legoIds = ids.slice(0, 20);
      await doc.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy danh sách sản phẩm đã xem (user)
router.get('/list', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await RecentlyViewed.findOne({ userId }).populate('legoIds');
    res.json({ success: true, data: doc?.legoIds || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
