const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Helper: allowed status transitions
const allowedTransitions = {
  pending: ['confirmed', 'canceled', 'refused'],
  confirmed: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: [],
  canceled: [],
  refunded: []
};

// POST /api/orders - create a new order (authenticated users)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, voucherId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // calculate total server-side
    const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

    const order = new Order({
      userId: req.user._id,
      items: items.map((it) => ({ legoId: it.legoId, quantity: it.quantity, price: it.price })),
      total,
      shippingAddress,
      paymentMethod: paymentMethod === 'VNPay' ? 'VNPay' : 'COD',
      paymentStatus: paymentMethod === 'VNPay' ? 'pending' : 'unpaid',
      voucherId: voucherId || undefined
    });

    await order.save();

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


// GET /api/orders - list with pagination and filter
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { orderNumber: new RegExp(q, 'i') }
      ];
    }

    const [itemsRaw, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email').lean(),
      Order.countDocuments(filter)
    ]);

    // normalize to include a `user` field (containing populated name/email) for client convenience
    const items = (itemsRaw || []).map((it) => ({ ...it, user: it.userId }));

    res.json({ items, total, page, pageSize: limit });
  } catch (err) {
    console.error('Orders list error', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - order detail
router.get('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
  const orderRaw = await Order.findById(id).populate('userId', 'name email').lean();
  if (!orderRaw) return res.status(404).json({ error: 'Order not found' });
  const order = { ...orderRaw, user: orderRaw.userId };
  res.json({ order });
  } catch (err) {
    console.error('Order detail error', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id - update status/payment/tracking
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const { status, paymentStatus, trackingNumber, note } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updates = {};
    const historyEntry = { by: req.user._id, at: new Date(), changes: {} };

    if (status && status !== order.status) {
      // validate transition
      const allowed = allowedTransitions[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${status}` });
      }
      updates.status = status;
      historyEntry.changes.status = { from: order.status, to: status };
    }

    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      updates.paymentStatus = paymentStatus;
      historyEntry.changes.paymentStatus = { from: order.paymentStatus, to: paymentStatus };
    }

    if (trackingNumber) {
      updates.trackingNumber = trackingNumber;
      historyEntry.changes.trackingNumber = trackingNumber;
    }

    if (Object.keys(historyEntry.changes).length === 0 && !note) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    if (note) historyEntry.note = note;

    // apply updates
    Object.assign(order, updates);

    // append history array (create if not exists)
    order.history = order.history || [];
    order.history.push(historyEntry);

    await order.save();

    res.json({ order });
  } catch (err) {
    console.error('Order update error', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;

