// backend/fix-indexes.js - Run this once to fix database indexes
const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare');
    console.log('✅ Connected to MongoDB');

    // Get Bill collection
    const Bill = mongoose.connection.collection('bills');

    // Drop the problematic billNumber index
    try {
      await Bill.dropIndex('billNumber_1');
      console.log('✅ Dropped billNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  billNumber_1 index does not exist (already dropped or never created)');
      } else {
        console.error('❌ Error dropping billNumber_1 index:', error.message);
      }
    }

    // List all indexes to verify
    const indexes = await Bill.indexes();
    console.log('\n📋 Current indexes on bills collection:');
    indexes.forEach(index => {
      console.log(`  - ${Object.keys(index.key).join(', ')}`);
    });

    console.log('\n✅ Index fix complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixIndexes();