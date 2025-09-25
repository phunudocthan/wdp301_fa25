const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    legoId: {
      type: Schema.Types.ObjectId,
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
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'canceled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    type: Schema.Types.Mixed,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'VNPay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed', 'refunded'],
    default: 'unpaid'
  },
  voucherId: {
    type: Schema.Types.ObjectId,
    ref: 'Voucher'
  }
}, {
  timestamps: true
});

OrderSchema.index({ status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD-${dateStr}-`)
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }

    this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
