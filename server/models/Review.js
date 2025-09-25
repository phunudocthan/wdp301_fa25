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
  comment: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['visible', 'hidden', 'reported'],
    default: 'visible'
  }
}, {
  timestamps: true
});

ReviewSchema.index({ legoId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ legoId: 1, rating: 1 });
ReviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
