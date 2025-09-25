const mongoose = require('mongoose');

const AgeRangeSchema = new mongoose.Schema({
  rangeLabel: {
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
  }
}, {
  timestamps: true
});

AgeRangeSchema.index({ rangeLabel: 1 }, { unique: true });

module.exports = mongoose.model('AgeRange', AgeRangeSchema);
