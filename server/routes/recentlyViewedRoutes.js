const express = require("express");
const router = express.Router();
const RecentlyViewed = require("../models/RecentlyViewed");
const Lego = require("../models/Lego");
const { requireAuth } = require("../middleware/authMiddleware");

const MAX_RECENTLY_VIEWED = 20;

// Lưu sản phẩm đã xem (user)
router.post("/add", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { legoId } = req.body;
    if (!legoId) return res.status(400).json({ error: "Missing legoId" });

    let doc = await RecentlyViewed.findOne({ userId });
    const now = new Date();

    if (!doc) {
      doc = await RecentlyViewed.create({
        userId,
        items: [{ legoId, views: 1, lastViewed: now }],
      });
    } else {
      if (!Array.isArray(doc.items)) {
        doc.items = [];
      }
      if (Array.isArray(doc.legoIds) && doc.legoIds.length && doc.items.length === 0) {
        doc.items = doc.legoIds.map((id) => ({
          legoId: id,
          views: 1,
          lastViewed: doc.updatedAt || now,
        }));
        doc.legoIds = undefined;
      }

      const existingIndex = doc.items.findIndex(
        (item) => item.legoId.toString() === legoId
      );

      if (existingIndex >= 0) {
        doc.items[existingIndex].views += 1;
        doc.items[existingIndex].lastViewed = now;
      } else {
        doc.items.unshift({ legoId, views: 1, lastViewed: now });
      }

      doc.items.sort((a, b) => b.lastViewed - a.lastViewed);
      doc.items = doc.items.slice(0, MAX_RECENTLY_VIEWED);
      await doc.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[recentlyViewed:add] error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy danh sách sản phẩm đã xem (user)
router.get("/list", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await RecentlyViewed.findOne({ userId })
      .populate("items.legoId")
      .lean();

    let items = [];
    if (doc?.items?.length) {
      items = doc.items;
    } else if (Array.isArray(doc?.legoIds) && doc.legoIds.length) {
      items = doc.legoIds.map((id) => ({
        legoId: id,
        views: 1,
        lastViewed: doc.updatedAt || new Date(),
      }));
    }

    const data = items.map((item) => ({
      lego: item.legoId,
      views: item.views ?? 1,
      lastViewed: item.lastViewed,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("[recentlyViewed:list] error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
