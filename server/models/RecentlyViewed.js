const mongoose = require('mongoose');

const RecentlyViewedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  legoIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lego'
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

RecentlyViewedSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

RecentlyViewedSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

RecentlyViewedSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('RecentlyViewed', RecentlyViewedSchema);
