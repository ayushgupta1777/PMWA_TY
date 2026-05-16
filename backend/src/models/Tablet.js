// backend/src/models/Tablet.js - FIXED STOCK STRUCTURE
const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  perTablet: {
    type: Number,
    required: true,
    min: 0
  },
  strip: {
    tabletsPerStrip: {
      type: Number,
      default: 10,
      min: 1
    },
    stripPrice: {
      type: Number,
      required: true,
      min: 0
    },
    savingsPercent: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  box: {
    stripsPerBox: {
      type: Number,
      default: 10,
      min: 1
    },
    boxPrice: {
      type: Number,
      min: 0
    },
    savingsPercent: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, { _id: false });

const stockSchema = new mongoose.Schema({
  boxes: {
    type: Number,
    default: 0,
    min: 0
  },
  strips: {
    type: Number,
    default: 0,
    min: 0
  },
  looseTablets: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const supplierSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorName: String,
  supplierPrice: {
    type: Number,
    default: 0
  },
  isPreferred: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const tabletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  strength: {
    type: String,
    required: true
  },
  pricing: {
    type: pricingSchema,
    required: true
  },
  stock: {
    type: stockSchema,
    required: true,
    default: {
      boxes: 0,
      strips: 0,
      looseTablets: 0
    }
  },
  category: {
    type: String,
    default: 'General',
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  suppliers: [supplierSchema],
  searchTerms: [{
    type: String,
    lowercase: true
  }],
  popularity: {
    type: Number,
    default: 0,
    index: true
  },
  dosageForm: {
    type: String,
    default: 'Tablet'
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  tags: [{
    type: String,
    lowercase: true
  }]
}, {
  timestamps: true
});

// ✅ VIRTUAL: Calculate total available tablets
tabletSchema.virtual('totalAvailableTablets').get(function() {
  const tabletsPerStrip = this.pricing?.strip?.tabletsPerStrip || 10;
  const stripsPerBox = this.pricing?.box?.stripsPerBox || 10;
  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
  
  return (this.stock.boxes * tabletsPerBox) + 
         (this.stock.strips * tabletsPerStrip) + 
         this.stock.looseTablets;
});

// ✅ VIRTUAL: Check if in stock (backward compatibility)
tabletSchema.virtual('inStock').get(function() {
  return this.totalAvailableTablets > 0;
});

// ✅ METHOD: Check availability for a specific quantity
tabletSchema.methods.checkAvailability = function(requestedQuantity) {
  const totalAvailable = this.totalAvailableTablets;
  
  return {
    available: totalAvailable >= requestedQuantity,
    totalAvailable: totalAvailable,
    requested: requestedQuantity,
    shortage: Math.max(0, requestedQuantity - totalAvailable)
  };
};

// ✅ METHOD: Calculate sale amount with breakdown
tabletSchema.methods.calculateSaleAmount = function(quantity) {
  const pricing = this.pricing;
  const perTablet = pricing.perTablet;
  const tabletsPerStrip = pricing.strip?.tabletsPerStrip || 10;
  const stripsPerBox = pricing.box?.stripsPerBox || 10;
  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
  
  const stripPrice = pricing.strip?.stripPrice || (perTablet * tabletsPerStrip);
  const boxPrice = pricing.box?.boxPrice || (stripPrice * stripsPerBox);
  
  // Calculate optimal breakdown
  const fullBoxes = Math.floor(quantity / tabletsPerBox);
  const remainingAfterBoxes = quantity % tabletsPerBox;
  const fullStrips = Math.floor(remainingAfterBoxes / tabletsPerStrip);
  const looseTablets = remainingAfterBoxes % tabletsPerStrip;
  
  let totalAmount = 0;
  const breakdown = [];
  const displayParts = [];
  
  if (fullBoxes > 0) {
    const boxTotal = fullBoxes * boxPrice;
    totalAmount += boxTotal;
    breakdown.push({
      type: 'Box',
      quantity: fullBoxes,
      price: boxPrice,
      subtotal: boxTotal
    });
    displayParts.push(`${fullBoxes} Box${fullBoxes > 1 ? 'es' : ''}`);
  }
  
  if (fullStrips > 0) {
    const stripTotal = fullStrips * stripPrice;
    totalAmount += stripTotal;
    breakdown.push({
      type: 'Strip',
      quantity: fullStrips,
      price: stripPrice,
      subtotal: stripTotal
    });
    displayParts.push(`${fullStrips} Strip${fullStrips > 1 ? 's' : ''}`);
  }
  
  if (looseTablets > 0) {
    const tabletTotal = looseTablets * perTablet;
    totalAmount += tabletTotal;
    breakdown.push({
      type: 'Tablet',
      quantity: looseTablets,
      price: perTablet,
      subtotal: tabletTotal
    });
    displayParts.push(`${looseTablets} Tablet${looseTablets > 1 ? 's' : ''}`);
  }
  
  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    breakdown: breakdown,
    displayText: displayParts.join(' + ')
  };
};

// ✅ METHOD: Deduct stock after sale
tabletSchema.methods.deductStock = function(quantity) {
  const tabletsPerStrip = this.pricing?.strip?.tabletsPerStrip || 10;
  const stripsPerBox = this.pricing?.box?.stripsPerBox || 10;
  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
  
  let remaining = quantity;
  
  // First deduct from loose tablets
  if (this.stock.looseTablets > 0) {
    const fromLoose = Math.min(remaining, this.stock.looseTablets);
    this.stock.looseTablets -= fromLoose;
    remaining -= fromLoose;
  }
  
  // Then deduct from strips
  if (remaining > 0 && this.stock.strips > 0) {
    const stripsNeeded = Math.ceil(remaining / tabletsPerStrip);
    const stripsToUse = Math.min(stripsNeeded, this.stock.strips);
    
    const tabletsFromStrips = stripsToUse * tabletsPerStrip;
    
    if (tabletsFromStrips > remaining) {
      // We have leftover tablets
      this.stock.strips -= stripsToUse;
      this.stock.looseTablets += (tabletsFromStrips - remaining);
      remaining = 0;
    } else {
      this.stock.strips -= stripsToUse;
      remaining -= tabletsFromStrips;
    }
  }
  
  // Finally deduct from boxes
  if (remaining > 0 && this.stock.boxes > 0) {
    const boxesNeeded = Math.ceil(remaining / tabletsPerBox);
    const boxesToUse = Math.min(boxesNeeded, this.stock.boxes);
    
    const tabletsFromBoxes = boxesToUse * tabletsPerBox;
    
    if (tabletsFromBoxes > remaining) {
      // We have leftover
      this.stock.boxes -= boxesToUse;
      const leftover = tabletsFromBoxes - remaining;
      
      // Convert leftover to strips and tablets
      const leftoverStrips = Math.floor(leftover / tabletsPerStrip);
      const leftoverTablets = leftover % tabletsPerStrip;
      
      this.stock.strips += leftoverStrips;
      this.stock.looseTablets += leftoverTablets;
      remaining = 0;
    } else {
      this.stock.boxes -= boxesToUse;
      remaining -= tabletsFromBoxes;
    }
  }
  
  return remaining === 0;
};

// ✅ INDEXES for better search performance
tabletSchema.index({ name: 'text', brand: 'text', company: 'text', searchTerms: 'text' });
tabletSchema.index({ name: 1, brand: 1 });
tabletSchema.index({ company: 1 });
tabletSchema.index({ category: 1 });
tabletSchema.index({ isActive: 1, popularity: -1 });
tabletSchema.index({ 'stock.boxes': 1, 'stock.strips': 1, 'stock.looseTablets': 1 });

// ✅ PRE-SAVE: Auto-generate search terms
tabletSchema.pre('save', function(next) {
  this.searchTerms = [
    this.name.toLowerCase(),
    this.brand?.toLowerCase(),
    this.company.toLowerCase(),
    this.category.toLowerCase()
  ].filter(Boolean);
  
  next();
});

// ✅ VIRTUAL for JSON output
tabletSchema.set('toJSON', { virtuals: true });
tabletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tablet', tabletSchema);