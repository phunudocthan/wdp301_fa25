const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true
  }
}, { _id: false });

const ChatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: {
    type: [MessageSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

ChatLogSchema.index({ userId: 1 });
ChatLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatLog', ChatLogSchema);
