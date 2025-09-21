const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  legoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lego'
    // Optional - gallery item may be general LEGO creation
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    trim: true
  },
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
GallerySchema.index({ userId: 1 });
GallerySchema.index({ legoId: 1 });
GallerySchema.index({ status: 1, createdAt: -1 });
GallerySchema.index({ likesCount: -1 }); // For sorting by most liked

module.exports = mongoose.model('Gallery', GallerySchema);
