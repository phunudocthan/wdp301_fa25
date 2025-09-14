const mongoose = require('mongoose');

const LegoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme'
  },
  ageRangeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgeRange'
  },
  difficultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Difficulty'
  },
  pieces: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [String], // Array of image URLs
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Text index for search
LegoSchema.index({ name: 'text', description: 'text' });
// Compound indexes
LegoSchema.index({ themeId: 1, price: 1 });
LegoSchema.index({ sellerId: 1, status: 1 });
LegoSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Lego', LegoSchema);
