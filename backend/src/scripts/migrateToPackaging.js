// backend/scripts/migrateToPackaging.js - RUN THIS ONCE TO UPDATE EXISTING DATA

const mongoose = require('mongoose');
const Tablet = require('../models/Tablet');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy';

async function migrateToPackaging() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all tablets without packaging
    const tablets = await Tablet.find({
      $or: [
        { packaging: { $exists: false } },
        { 'packaging.packPrice': { $exists: false } }
      ]
    });

    console.log(`📦 Found ${tablets.length} medicines to migrate`);

    let updated = 0;
    let errors = 0;

    for (const tablet of tablets) {
      try {
        // Set default packaging based on existing price
        const price = tablet.price || 10; // Default ₹10 if no price
        
        tablet.packaging = {
          packType: 'Strip',
          unitsPerPack: 10,
          unitType: 'Tablet',
          packPrice: price * 10, // Assume 10 units per pack
          unitPrice: price,
          canSellByPack: true,
          canSellByUnit: true
        };

        // Keep existing stock as pack stock
        // looseUnits already defaults to 0

        // If no suppliers, leave empty array
        if (!tablet.suppliers || tablet.suppliers.length === 0) {
          tablet.suppliers = [];
        }

        await tablet.save();
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`✅ Migrated ${updated}/${tablets.length} medicines...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${tablet.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total processed: ${tablets.length}`);

    if (updated > 0) {
      console.log('\n⚠️  IMPORTANT: Please review the migrated medicines and update:');
      console.log('   1. Pack Type (Strip/Blister/Bottle/etc.)');
      console.log('   2. Units Per Pack (actual count)');
      console.log('   3. Pack Price and Unit Price (actual prices)');
      console.log('   4. Add vendors/suppliers for each medicine');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateToPackaging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrateToPackaging;