const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

CartSchema.index({ userId: 1 }, { unique: true });
CartSchema.index({ 'items.legoId': 1 });

module.exports = mongoose.model('Cart', CartSchema);
