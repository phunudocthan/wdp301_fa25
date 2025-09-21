const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for guest carts
  },
  items: [{
    legoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lego',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtAdd: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Index for efficient cart lookups
CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.legoId': 1 });

module.exports = mongoose.model('Cart', CartSchema);
