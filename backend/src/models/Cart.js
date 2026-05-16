// backend/src/models/Cart.js - WITH PACKAGING SUPPORT

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  tablet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tablet',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceAtTime: {
    type: Number,
    required: true
  },
  // Packaging calculation fields (calculated, not stored)
  calculatedPrice: Number,
  priceBreakdown: [{
    type: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  displayText: String
}, { _id: true });

const savedItemSchema = new mongoose.Schema({
  tablet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tablet',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtTime: {
    type: Number,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  savedItems: [savedItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Method to calculate totals with packaging pricing
cartSchema.methods.calculateTotals = async function() {
  await this.populate('items.tablet');
  
  let totalAmount = 0;
  let totalItems = 0;

  for (const item of this.items) {
    if (item.tablet && item.tablet.packaging) {
      // Use tablet's calculateSaleAmount method
      const saleCalc = item.tablet.calculateSaleAmount(item.quantity);
      totalAmount += saleCalc.totalAmount;
      totalItems += item.quantity;
      
      // Store calculated values (these are virtual, not persisted)
      item.calculatedPrice = saleCalc.totalAmount;
      item.priceBreakdown = saleCalc.breakdown;
      item.displayText = saleCalc.displayText;
    } else if (item.tablet) {
      // Fallback for old data
      const itemTotal = item.quantity * (item.tablet.price || item.priceAtTime);
      totalAmount += itemTotal;
      totalItems += item.quantity;
    }
  }

  this.totalAmount = Math.round(totalAmount * 100) / 100; // Round to 2 decimals
  this.totalItems = totalItems;
  
  return {
    totalAmount: this.totalAmount,
    totalItems: this.totalItems
  };
};

// Method to check if cart is valid (all items in stock)
cartSchema.methods.validateCart = async function() {
  await this.populate('items.tablet');
  
  const issues = [];

  for (const item of this.items) {
    if (!item.tablet) {
      issues.push({
        item: item._id,
        issue: 'Medicine not found'
      });
      continue;
    }

    const availability = item.tablet.checkAvailability(item.quantity);
    if (!availability.available) {
      issues.push({
        item: item._id,
        medicine: item.tablet.name,
        issue: 'Insufficient stock',
        available: availability.totalAvailable,
        requested: item.quantity
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

// Virtual for unique items count
cartSchema.virtual('uniqueItems').get(function() {
  return this.items.length;
});

// Index for faster lookups
cartSchema.index({ worker: 1 });
cartSchema.index({ 'items.tablet': 1 });
cartSchema.index({ lastModified: -1 });

module.exports = mongoose.model('Cart', cartSchema);