const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableSellerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // If empty array, voucher is global
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ status: 1 });
VoucherSchema.index({ validTo: 1 });
VoucherSchema.index({ createdBy: 1 });

// Virtual for checking if voucher is expired
VoucherSchema.virtual('isExpired').get(function() {
  return new Date() > this.validTo;
});

// Virtual for checking if voucher is available
VoucherSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         !this.isExpired && 
         this.usedCount < this.usageLimit;
});

module.exports = mongoose.model('Voucher', VoucherSchema);
