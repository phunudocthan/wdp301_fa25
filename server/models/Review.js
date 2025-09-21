const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  legoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lego',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true
  },
  comment: {
    type: String,
    trim: true
  },
  images: [String], // Array of image URLs
  status: {
    type: String,
    enum: ['active', 'reported', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews per user per product
ReviewSchema.index({ legoId: 1, userId: 1 }, { unique: true });
// Index for aggregation
ReviewSchema.index({ legoId: 1, rating: 1 });
ReviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
