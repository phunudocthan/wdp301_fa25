const mongoose = require('mongoose');

const DifficultySchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Difficulty label is required'],
    unique: true,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Difficulty', DifficultySchema);
