// backend/cleanupOrders.js
const mongoose = require('mongoose');
require('dotenv').config();

const StockRequest = require('../src/models/StockRequest');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare');
    console.log('✅ Connected to MongoDB');

    // Reset all "Ordered" back to "Approved" for testing
    const result = await StockRequest.updateMany(
      { status: 'Ordered' },
      { 
        $set: { 
          status: 'Approved',
          orderDetails: {
            vendor: null,
            orderDate: null,
            expectedDeliveryDate: null,
            actualDeliveryDate: null,
            invoiceNumber: '',
            totalCost: 0,
            receivedQuantity: 0,
            notes: ''
          }
        } 
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} requests back to Approved`);

    await mongoose.connection.close();
    console.log('✅ Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();