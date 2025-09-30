const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['promotion', 'order', 'product', 'system', 'engagement'],
    required: true,
    default: 'system',
    description: 'Chủ đề: khuyến mãi, đơn hàng, sản phẩm mới, hệ thống, tương tác khách hàng'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  meta: {
    type: Object,
    default: {}
  },
  type: {
    type: String,
    enum: ['order', 'system', 'promotion', 'product', 'engagement'],
    required: true,
    default: 'system',
    description: 'Loại thông báo (có thể trùng với category cho tương thích cũ)'
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: false
});

NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
