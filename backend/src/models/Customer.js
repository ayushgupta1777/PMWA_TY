// backend/src/models/Customer.js
const mongoose = require('mongoose');

const customerPurchaseSchema = new mongoose.Schema({
  tabletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tablet'
  },
  tabletName: String,
  quantity: Number,
  discount: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // Track purchases history
  purchases: [customerPurchaseSchema],
  
  // Summary stats
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  firstPurchaseDate: Date,
  lastPurchaseDate: Date
}, {
  timestamps: true
});

// Index for faster lookups
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ lastPurchaseDate: -1 });

module.exports = mongoose.model('Customer', customerSchema);