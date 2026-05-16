// backend/src/models/Bill.js
const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  tablet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tablet',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: String,
  company: String,
  strength: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtTime: {
    type: Number,
    required: true
  },
  calculatedPrice: {
    type: Number,
    required: true
  },
  priceBreakdown: [{
    type: {
      type: String,
      enum: ['pack', 'unit']
    },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  displayText: String,
  
  // ✅ NEW: Per-tablet discount
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

// const billSchema = new mongoose.Schema({
//   invoiceNumber: {
//     type: String,
//     required: true,
//     unique: true,
//     index: true
//   },
//   // Keep billNumber for backward compatibility but make it optional
//   billNumber: {
//     type: String,
//     sparse: true,
//     index: true
//   },
//    // ✅ UPDATED: Optional customer details
//   customerName: {
//     type: String,
//     trim: true,
//     default: 'Walk-in Customer'
//   },
//   customerPhone: {
//     type: String,
//     trim: true,
//     default: null,
//     sparse: true
//   },
//   customerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Customer',
//     sparse: true
//   },


//   worker: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Worker',
//     required: true,
//     index: true
//   },
//   customerName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   customerPhone: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   items: [billItemSchema],
//   subtotal: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   discount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   discountPercentage: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   total: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cash', 'card', 'upi', 'other'],
//     default: 'cash'
//   },
//   date: {
//     type: Date,
//     default: Date.now,
//     index: true
//   },
//   status: {
//     type: String,
//     enum: ['completed', 'cancelled', 'refunded'],
//     default: 'completed'
//   }
// }, {
//   timestamps: true
// });

// // Indexes for better query performance
// billSchema.index({ worker: 1, date: -1 });
// billSchema.index({ customerPhone: 1 });
// billSchema.index({ invoiceNumber: 1 });
// billSchema.index({ date: -1 });

// // Virtual for total items count
// billSchema.virtual('totalItems').get(function() {
//   return this.items.reduce((total, item) => total + item.quantity, 0);
// });

// // Virtual for formatted date
// billSchema.virtual('formattedDate').get(function() {
//   return this.date.toLocaleDateString('en-IN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric'
//   });
// });

// module.exports = mongoose.model('Bill', billSchema);


const billSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  billNumber: {
    type: String,
    sparse: true,
    index: true
  },
  
  // ✅ UPDATED: Optional customer details
  customerName: {
    type: String,
    trim: true,
    default: 'Walk-in Customer'
  },
  customerPhone: {
    type: String,
    trim: true,
    default: null,
    sparse: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true
  },
  
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
    index: true
  },
  
  items: [billItemSchema],
  
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  // ✅ UPDATED: Total discount (sum of all per-item discounts)
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'other'],
    default: 'cash'
  },
  
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  
  // ✅ NEW: Track modifications
  isModified: {
    type: Boolean,
    default: false
  },
  modifiedAt: Date,
  modificationHistory: [{
    modifiedBy: mongoose.Schema.Types.ObjectId,
    changes: Object,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
billSchema.index({ worker: 1, date: -1 });
billSchema.index({ customerPhone: 1 });
billSchema.index({ invoiceNumber: 1 });
billSchema.index({ date: -1 });
billSchema.index({ customerId: 1 });

// Virtual for total items count
billSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for formatted date
billSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

module.exports = mongoose.model('Bill', billSchema);