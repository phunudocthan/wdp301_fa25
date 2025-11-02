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
  replies: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, trim: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  votes: {
    up: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    down: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  status: {
    type: String,
    enum: ['visible', 'hidden', 'reported'],
    default: 'visible'
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Review', ReviewSchema);
