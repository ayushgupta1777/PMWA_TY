// backend/scripts/migrateTabletSchema.js
const mongoose = require('mongoose');
const Tablet = require('../models/Tablet');

async function migrateTablets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma');
    
    console.log('🔄 Starting migration...');
    
    const tablets = await mongoose.connection.collection('tablets').find({}).toArray();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const tablet of tablets) {
      // Skip if already migrated
      if (tablet.pricing && tablet.pricing.perTablet) {
        skipped++;
        continue;
      }
      
      // OLD FORMAT: Has price, stock, packaging
      // NEW FORMAT: pricing{perTablet, strip{}, box{}}, stock{boxes, strips, looseTablets}
      
      const update = {};
      
      // Migrate pricing
      if (tablet.packaging) {
        update.pricing = {
          perTablet: tablet.packaging.unitPrice || tablet.price || 10,
          strip: {
            tabletsPerStrip: tablet.packaging.unitsPerPack || 10,
            stripPrice: tablet.packaging.packPrice || (tablet.price * 10 * 0.9)
          },
          box: {
            stripsPerBox: 10,
            boxPrice: null
          }
        };
      } else {
        // No packaging info - create default
        update.pricing = {
          perTablet: tablet.price || 10,
          strip: {
            tabletsPerStrip: 10,
            stripPrice: (tablet.price || 10) * 10 * 0.9 // 10% discount
          },
          box: {
            stripsPerBox: 10,
            boxPrice: null
          }
        };
      }
      
      // Migrate stock
      if (typeof tablet.stock === 'number') {
        // Old format: stock was number of strips
        update.stock = {
          boxes: 0,
          strips: tablet.stock || 0,
          looseTablets: tablet.looseUnits || 0
        };
      }
      
      await mongoose.connection.collection('tablets').updateOne(
        { _id: tablet._id },
        { $set: update }
      );
      
      migrated++;
      console.log(`✅ Migrated: ${tablet.name}`);
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${tablets.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTablets();