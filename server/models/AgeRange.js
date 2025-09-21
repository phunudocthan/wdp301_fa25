const mongoose = require('mongoose');

const AgeRangeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Age range label is required'],
    trim: true
  },
  minAge: {
    type: Number,
    min: 0
  },
  maxAge: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
AgeRangeSchema.index({ minAge: 1, maxAge: 1 });

module.exports = mongoose.model('AgeRange', AgeRangeSchema);
