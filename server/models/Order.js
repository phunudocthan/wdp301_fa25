const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
    // Format: ORD-20250913-0001 - will be generated automatically
  },
  customerId: {
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
    title: {
      type: String,
      required: true // Snapshot of product title at purchase time
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0 // Snapshot of product price at purchase time
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0 // quantity * unitPrice
    }
  }],
  shippingAddress: {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    phone: { 
      type: String, 
      required: true,
      trim: true
    },
    addressLine1: { 
      type: String, 
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    city: { 
      type: String, 
      required: true,
      trim: true
    },
    postcode: { 
      type: String, 
      required: true,
      trim: true
    },
    country: { 
      type: String, 
      default: 'Vietnam',
      trim: true
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  voucherCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'VNPay'],
    required: true
  },
  paymentInfo: {
    vnpTransactionId: String,
    status: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Optional field for marketplace view
  },
  notes: {
    type: String,
    trim: true
    // Internal notes for order processing
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ paymentMethod: 1 });
OrderSchema.index({ voucherCode: 1 });

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order of the day
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD-${dateStr}-`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
