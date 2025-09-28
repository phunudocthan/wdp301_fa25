const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

BannerSchema.index({ status: 1 });
BannerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Banner', BannerSchema);
