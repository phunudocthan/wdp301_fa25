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
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    trim: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['visible', 'hidden', 'reported'],
    default: 'visible'
  }
}, {
  timestamps: true
});

GallerySchema.index({ userId: 1 });
GallerySchema.index({ legoId: 1 });
GallerySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', GallerySchema);
