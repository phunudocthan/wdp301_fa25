const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  legoIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lego'
  }]
}, {
  timestamps: true
});


module.exports = mongoose.model('Wishlist', WishlistSchema);
