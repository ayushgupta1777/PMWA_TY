// backend/src/models/StockRequest.js
const mongoose = require('mongoose');

const stockRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true
  },
  tablet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tablet',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  urgencyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  reason: {
    type: String,
    required: [true, 'Reason for stock request is required'],
    maxLength: [500, 'Reason cannot exceed 500 characters']
  },
  estimatedCost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Ordered', 'Received', 'Cancelled'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  reviewedAt: Date,
  adminNotes: {
    type: String,
    maxLength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // 🔥 UPDATED: Make this field optional and handle invalid values
  preferredVendor: {
    type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed
    ref: 'Vendor',
    default: null
  },
  
  orderDetails: {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    orderDate: Date,
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    invoiceNumber: String,
    totalCost: Number,
    receivedQuantity: Number,
    notes: String
  },
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-generate request number
stockRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    this.requestNumber = `SR-${date}-${(count + 1).toString().padStart(3, '0')}`;
  }
  
  // 🔥 Clean up invalid preferredVendor values
  if (this.preferredVendor && typeof this.preferredVendor === 'string') {
    if (!mongoose.Types.ObjectId.isValid(this.preferredVendor)) {
      console.log(`⚠️ Cleaning invalid vendor ID: ${this.preferredVendor}`);
      this.preferredVendor = null;
    }
  }
  
  next();
});

stockRequestSchema.index({ requestedBy: 1, createdAt: -1 });
stockRequestSchema.index({ status: 1, createdAt: -1 });
stockRequestSchema.index({ tablet: 1 });

module.exports = mongoose.model('StockRequest', stockRequestSchema);

