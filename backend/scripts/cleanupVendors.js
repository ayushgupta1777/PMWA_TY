// backend/scripts/cleanupVendors.js
const mongoose = require('mongoose');
require('dotenv').config();

const StockRequest = require('../src/models/StockRequest');

const cleanupInvalidVendors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare');
    console.log('✅ Connected to MongoDB');

    // Find all stock requests
    const requests = await StockRequest.find({});

    console.log(`🔍 Checking ${requests.length} requests...`);

    let cleanedCount = 0;

    for (const request of requests) {
      let needsSave = false;

      // Clean preferredVendor
      if (request.preferredVendor && 
          typeof request.preferredVendor === 'string' && 
          !mongoose.Types.ObjectId.isValid(request.preferredVendor)) {
        console.log(`🧹 Cleaning preferredVendor in ${request.requestNumber}: ${request.preferredVendor}`);
        request.preferredVendor = null;
        needsSave = true;
      }

      // Clean orderDetails.vendor
      if (request.orderDetails && 
          request.orderDetails.vendor && 
          typeof request.orderDetails.vendor === 'string' && 
          !mongoose.Types.ObjectId.isValid(request.orderDetails.vendor)) {
        console.log(`🧹 Cleaning orderDetails.vendor in ${request.requestNumber}: ${request.orderDetails.vendor}`);
        request.orderDetails.vendor = null;
        needsSave = true;
      }

      if (needsSave) {
        await request.save();
        cleanedCount++;
      }
    }

    console.log(`✅ Cleanup completed! Cleaned ${cleanedCount} requests.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
};

cleanupInvalidVendors();