const mongoose = require('mongoose');

const DifficultySchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Difficulty label is required'],
    trim: true
  },
  level: {
    type: Number,
    required: [true, 'Difficulty level is required'],
    min: 1,
    max: 5,
    unique: true
  }
}, {
  timestamps: true
});

DifficultySchema.index({ label: 1 }, { unique: true });

module.exports = mongoose.model('Difficulty', DifficultySchema);
