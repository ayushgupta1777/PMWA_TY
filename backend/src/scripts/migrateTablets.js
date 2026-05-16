// backend/scripts/migrateTablets.js
// Run this script ONCE to migrate existing tablets to new packaging system

const mongoose = require('mongoose');
const Tablet = require('../models/Tablet');
require('dotenv').config();

async function migrateTablets() {
  try {
    console.log('🔄 Starting tablet migration to packaging system...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma_db');
    console.log('✅ Connected to MongoDB\n');

    // Find all tablets without packaging
    const tablets = await Tablet.find({
      $or: [
        { 'packaging.packPrice': { $exists: false } },
        { packaging: null }
      ]
    });

    console.log(`📦 Found ${tablets.length} tablets to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const tablet of tablets) {
      try {
        // Default packaging configuration
        const defaultUnitsPerPack = 10;
        const packPrice = tablet.price || 10; // Use existing price or default
        const unitPrice = packPrice / defaultUnitsPerPack;

        // Determine pack type based on dosage form
        let packType = 'Strip';
        if (tablet.dosageForm === 'Syrup') packType = 'Bottle';
        else if (tablet.dosageForm === 'Injection') packType = 'Ampoule';
        else if (tablet.dosageForm === 'Cream') packType = 'Tube';

        // Determine unit type
        let unitType = 'Tablet';
        if (tablet.dosageForm === 'Capsule') unitType = 'Capsule';
        else if (tablet.dosageForm === 'Syrup') unitType = 'ml';
        else if (tablet.dosageForm === 'Cream') unitType = 'gm';

        // Update tablet with packaging
        tablet.packaging = {
          packType: packType,
          unitsPerPack: defaultUnitsPerPack,
          unitType: unitType,
          packPrice: packPrice,
          unitPrice: unitPrice,
          canSellByPack: true,
          canSellByUnit: true
        };

        // Initialize loose units
        tablet.looseUnits = 0;

        // Migrate suppliers if old supplier exists
        if (tablet.supplier && tablet.supplier.name) {
          tablet.suppliers = [{
            vendorName: tablet.supplier.name,
            isPreferred: true,
            addedAt: new Date()
          }];
        }

        await tablet.save();
        successCount++;
        console.log(`✅ Migrated: ${tablet.name} (${tablet.brand})`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate ${tablet.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total tablets: ${tablets.length}`);
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    // Display sample migrated tablet
    const sample = await Tablet.findOne({ 'packaging.packPrice': { $exists: true } }).lean();
    if (sample) {
      console.log('📝 Sample Migrated Tablet:');
      console.log(`   Name: ${sample.name}`);
      console.log(`   Pack Type: ${sample.packaging.packType}`);
      console.log(`   Units/Pack: ${sample.packaging.unitsPerPack}`);
      console.log(`   Pack Price: ₹${sample.packaging.packPrice}`);
      console.log(`   Unit Price: ₹${sample.packaging.unitPrice.toFixed(2)}`);
      console.log(`   Stock: ${sample.stock} packs`);
      console.log(`   Total Units: ${sample.stock * sample.packaging.unitsPerPack}`);
      console.log('');
    }

    console.log('✅ Migration completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('\n' + '='.repeat(50));
console.log('   TABLET PACKAGING MIGRATION SCRIPT');
console.log('='.repeat(50) + '\n');
console.log('⚠️  WARNING: This will update all existing tablets');
console.log('⚠️  Make sure you have a database backup!\n');

// Uncomment the line below to run the migration
// migrateTablets();

// Or run with: node scripts/migrateTablets.js

module.exports = { migrateTablets };