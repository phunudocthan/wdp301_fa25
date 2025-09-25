const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled'],
    default: 'active'
  }
}, {
  timestamps: true
});

VoucherSchema.index({ status: 1 });
VoucherSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Voucher', VoucherSchema);
