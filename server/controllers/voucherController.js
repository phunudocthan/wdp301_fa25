const Voucher = require('../models/Voucher');

// Helper to build query filters
const buildFilters = (query) => {
  const filters = {};
  if (query.search) {
    filters.code = { $regex: query.search, $options: 'i' };
  }
  if (query.status) filters.status = query.status;
  return filters;
};

exports.listVouchers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.min(100, parseInt(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    const [total, vouchers] = await Promise.all([
      Voucher.countDocuments(filters),
      Voucher.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: {
        vouchers,
        pagination: {
          currentPage: page,
          totalPages,
          totalVouchers: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('listVouchers error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true, data: voucher });
  } catch (error) {
    console.error('getVoucher error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const { code, discountPercent, expiryDate, usageLimit, status } = req.body;
    // Basic required fields
    if (!code || discountPercent == null || !expiryDate || usageLimit == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Normalize and validate
    const normCode = String(code).toUpperCase().trim();
    const pct = Number(discountPercent);
    const usage = Number(usageLimit);
    const exp = new Date(expiryDate);

    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ success: false, message: 'discountPercent must be 0-100' });
    }
    if (!Number.isInteger(usage) || usage < 1) {
      return res.status(400).json({ success: false, message: 'usageLimit must be integer >= 1' });
    }
    if (isNaN(exp.getTime())) {
      return res.status(400).json({ success: false, message: 'expiryDate is invalid' });
    }

    const existing = await Voucher.findOne({ code: normCode });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Voucher code already exists' });
    }

    const voucher = await Voucher.create({
      code: normCode,
      discountPercent: pct,
      expiryDate: exp,
      usageLimit: usage,
      status: status || 'active',
    });

    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    console.error('createVoucher error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    // Normalize and validate updates
    if (updates.code) updates.code = String(updates.code).toUpperCase().trim();

    if (updates.discountPercent != null) {
      const pct = Number(updates.discountPercent);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, message: 'discountPercent must be 0-100' });
      }
      updates.discountPercent = pct;
    }

    if (updates.usageLimit != null) {
      const usage = Number(updates.usageLimit);
      if (!Number.isInteger(usage) || usage < 1) {
        return res.status(400).json({ success: false, message: 'usageLimit must be integer >= 1' });
      }
      updates.usageLimit = usage;
    }

    if (updates.expiryDate != null) {
      const exp = new Date(updates.expiryDate);
      if (isNaN(exp.getTime())) {
        return res.status(400).json({ success: false, message: 'expiryDate is invalid' });
      }
      updates.expiryDate = exp;
    }

    // Prevent duplicate codes
    if (updates.code) {
      const exists = await Voucher.findOne({ code: updates.code, _id: { $ne: id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Voucher code already in use' });
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(id, updates, { new: true });
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true, data: voucher });
  } catch (error) {
    console.error('updateVoucher error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('deleteVoucher error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'expired', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const voucher = await Voucher.findByIdAndUpdate(id, { status }, { new: true });
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true, data: voucher });
  } catch (error) {
    console.error('updateVoucherStatus error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
