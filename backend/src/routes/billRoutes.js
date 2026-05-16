// backend/src/routes/billRoutes.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Cart = require('../models/Cart');
const Tablet = require('../models/Tablet');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/authMiddleware');

// 📄 GENERATE BILL
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { customerName, customerPhone, paymentMethod, items } = req.body;
    const userId = req.user.id;

    console.log('📝 Bill generation request');

    // ✅ CHANGED: Get cart (no longer checking customer details)
    const cart = await Cart.findOne({ worker: userId })
      .populate({
        path: 'items.tablet',
        select: 'name brand company strength price stock packaging looseUnits isActive'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate items from request
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided'
      });
    }

    // ✅ STEP 1: Validate and build bill items with per-item discounts
    console.log('\n📋 STEP 1: Validating items with discounts...');
    const billItems = [];
    const errors = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (let i = 0; i < items.length; i++) {
      const requestItem = items[i];
      const cartItem = cart.items.find(ci => ci.tablet._id.toString() === requestItem.tablet);

      if (!cartItem) {
        errors.push(`Item not found in cart`);
        continue;
      }

      const tablet = cartItem.tablet;

      if (tablet.isActive === false) {
        errors.push(`${tablet.name} is no longer available`);
        continue;
      }

      const itemCalculatedPrice = requestItem.price || cartItem.calculatedPrice || 0;
      const discountPercentage = Math.min(Math.max(requestItem.discountPercentage || 0, 0), 100);
      const discountAmount = itemCalculatedPrice * (discountPercentage / 100);
      const finalPrice = itemCalculatedPrice - discountAmount;

      console.log(`  Item: ${tablet.name}`);
      console.log(`    Price: ₹${itemCalculatedPrice.toFixed(2)}, Discount: ${discountPercentage}%, Final: ₹${finalPrice.toFixed(2)}`);

      billItems.push({
        tablet: tablet._id,
        name: tablet.name,
        brand: tablet.brand,
        company: tablet.company,
        strength: tablet.strength,
        quantity: cartItem.quantity,
        priceAtTime: cartItem.priceAtTime || 0,
        calculatedPrice: itemCalculatedPrice,
        priceBreakdown: cartItem.priceBreakdown || [],
        displayText: cartItem.displayText,
        // ✅ NEW: Per-item discount
        discountPercentage,
        discountAmount,
        finalPrice
      });

      subtotal += itemCalculatedPrice;
      totalDiscount += discountAmount;
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('; ')
      });
    }

    if (billItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items could be processed'
      });
    }

    const total = subtotal - totalDiscount;

    console.log('\n💵 STEP 2: Totals calculated');
    console.log(`  Subtotal: ₹${subtotal.toFixed(2)}`);
    console.log(`  Total Discount: ₹${totalDiscount.toFixed(2)}`);
    console.log(`  Final Total: ₹${total.toFixed(2)}`);

    // ✅ STEP 3: Generate invoice number
    console.log('\n📋 STEP 3: Generating invoice number...');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const billCount = await Bill.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const invoiceNumber = `INV-${dateStr}-${String(billCount + 1).padStart(4, '0')}`;
    console.log('✅ Invoice number:', invoiceNumber);

    // ✅ STEP 4: Create or update customer
    console.log('\n👤 STEP 4: Processing customer...');
    let customerId = null;

    if (customerPhone) {
      console.log(`  Phone: ${customerPhone}, Name: ${customerName || 'Not provided'}`);
      
      let customer = await Customer.findOne({ phone: customerPhone });

      if (!customer) {
        customer = new Customer({
          name: customerName || `Customer-${customerPhone}`,
          phone: customerPhone,
          firstPurchaseDate: new Date()
        });
      } else {
        customer.name = customerName || customer.name;
      }

      // Add purchase to history
      billItems.forEach(item => {
        customer.purchases.push({
          tabletId: item.tablet,
          tabletName: item.name,
          quantity: item.quantity,
          discount: item.discountPercentage
        });
      });

      customer.totalPurchases = (customer.totalPurchases || 0) + billItems.length;
      customer.totalSpent = (customer.totalSpent || 0) + total;
      customer.lastPurchaseDate = new Date();

      await customer.save();
      customerId = customer._id;
      console.log(`  ✅ Customer updated: ${customer._id}`);
    }

    // ✅ STEP 5: Create bill
    console.log('\n💾 STEP 5: Creating bill...');
    const bill = new Bill({
      invoiceNumber,
      worker: userId,
      customerName: customerName || 'Walk-in Customer', // ✅ Default value
      customerPhone: customerPhone || null, // ✅ Optional
      customerId,
      items: billItems,
      subtotal,
      totalDiscount,
      total,
      paymentMethod: paymentMethod || 'cash',
      date: new Date()
    });

    const savedBill = await bill.save();
    console.log('✅ Bill saved:', savedBill._id);

    // ✅ STEP 6: Clear cart
    console.log('\n🧹 STEP 6: Clearing cart...');
    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;
    await cart.save();
    console.log('✅ Cart cleared');

    // Populate for response
    await savedBill.populate('items.tablet', 'name brand company strength packaging');

    console.log('\n✨ Bill generation completed successfully!\n');

    res.json({
      success: true,
      message: 'Bill generated successfully',
      bill: savedBill
    });

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 📋 GET ALL BILLS
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const userId = req.user.id;

    const query = { worker: userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('invoiceNumber customerName customerPhone total date paymentMethod')
      .lean();

    const totalBills = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalBills,
        totalPages: Math.ceil(totalBills / limit)
      }
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills'
    });
  }
});

// 📄 GET SINGLE BILL
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('items.tablet', 'name brand company strength packaging')
      .populate('worker', 'name email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      bill
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill'
    });
  }
});

// ✏️ UPDATE BILL (Modify existing bill)
router.put('/:billId', authMiddleware, async (req, res) => {
  try {
    const { billId } = req.params;
    const { customerName, customerPhone, items } = req.body;

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // ✅ Update customer details if provided
    if (customerName !== undefined) {
      bill.customerName = customerName || 'Walk-in Customer';
    }

    if (customerPhone !== undefined) {
      bill.customerPhone = customerPhone || null;
    }

    // ✅ Update items with new discounts if provided
    if (Array.isArray(items)) {
      let newSubtotal = 0;
      let newTotalDiscount = 0;

      bill.items = items.map(updatedItem => {
        const item = bill.items.find(i => i.tablet.toString() === updatedItem.tablet);
        
        if (item) {
          const calculatedPrice = updatedItem.price || item.calculatedPrice;
          const discountPercentage = Math.min(Math.max(updatedItem.discountPercentage || 0, 0), 100);
          const discountAmount = calculatedPrice * (discountPercentage / 100);
          const finalPrice = calculatedPrice - discountAmount;

          newSubtotal += calculatedPrice;
          newTotalDiscount += discountAmount;

          return {
            ...item,
            discountPercentage,
            discountAmount,
            finalPrice,
            calculatedPrice
          };
        }

        return item;
      });

      bill.subtotal = newSubtotal;
      bill.totalDiscount = newTotalDiscount;
      bill.total = newSubtotal - newTotalDiscount;
    }

    bill.isModified = true;
    bill.modifiedAt = new Date();

    const updatedBill = await bill.save();

    await updatedBill.populate('items.tablet', 'name brand company strength packaging');

    res.json({
      success: true,
      message: 'Bill updated successfully',
      bill: updatedBill
    });

  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
// // backend/src/routes/billRoutes.js - ROBUST VERSION
// const express = require('express');
// const router = express.Router();
// const Bill = require('../models/Bill');
// const Cart = require('../models/Cart');
// const Tablet = require('../models/Tablet');
// const authMiddleware = require('../middleware/authMiddleware');

// // 📄 GENERATE BILL
// router.post('/generate', authMiddleware, async (req, res) => {
//   try {
//     const { customerName, customerPhone, paymentMethod, discount } = req.body;
//     const userId = req.user.id;

//     console.log('Bill generation request:', { customerName, customerPhone, userId });

//     // Validation
//     if (!customerName || !customerPhone) {
//       return res.status(400).json({
//         success: false,
//         message: 'Customer name and phone are required'
//       });
//     }

//     if (customerPhone.length !== 10) {
//       return res.status(400).json({
//         success: false,
//         message: 'Phone number must be 10 digits'
//       });
//     }

//     // Get cart with populated items
//     const cart = await Cart.findOne({ worker: userId })
//       .populate({
//         path: 'items.tablet',
//         select: 'name brand company strength price stock category packaging looseUnits isActive'
//       });

//     console.log('Cart found:', { 
//       hasCart: !!cart, 
//       itemsCount: cart?.items?.length 
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty'
//       });
//     }

//     // Filter out null tablets and validate
//     const validItems = cart.items.filter(item => {
//       if (!item.tablet) {
//         console.warn('Found cart item with null tablet, removing...');
//         return false;
//       }
//       return true;
//     });

//     if (validItems.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No valid items in cart'
//       });
//     }

//     // Calculate totals with packaging
//     let subtotal = 0;
//     const billItems = [];
//     const errors = [];

//     for (let i = 0; i < validItems.length; i++) {
//       const item = validItems[i];
//       const tablet = item.tablet;
      
//       console.log(`Processing item ${i + 1}:`, {
//         name: tablet.name,
//         quantity: item.quantity,
//         stock: tablet.stock,
//         looseUnits: tablet.looseUnits,
//         hasPackaging: !!tablet.packaging,
//         isActive: tablet.isActive
//       });
      
//       // Check if medicine is active (only if field exists and is false)
//       if (tablet.isActive === false) {
//         errors.push(`${tablet.name} is no longer available`);
//         continue;
//       }

//       // Get packaging info with fallbacks
//       const unitsPerPack = tablet.packaging?.unitsPerPack || 10;
//       const packPrice = tablet.packaging?.packPrice || tablet.price || 0;
//       const unitPrice = tablet.packaging?.unitPrice || (packPrice / unitsPerPack) || 0;

//       console.log(`Pricing for ${tablet.name}:`, {
//         unitsPerPack,
//         packPrice,
//         unitPrice
//       });

//       // Validate pricing
//       if (!packPrice && !unitPrice) {
//         errors.push(`Price information missing for ${tablet.name}`);
//         continue;
//       }

//       // Check availability
//       const totalAvailable = (tablet.stock * unitsPerPack) + (tablet.looseUnits || 0);
      
//       console.log(`Availability for ${tablet.name}:`, {
//         totalAvailable,
//         requested: item.quantity
//       });

//       if (totalAvailable < item.quantity) {
//         errors.push(`Insufficient stock for ${tablet.name}. Only ${totalAvailable} tablets available`);
//         continue;
//       }

//       // Calculate price breakdown
//       const fullPacks = Math.floor(item.quantity / unitsPerPack);
//       const looseUnits = item.quantity % unitsPerPack;
      
//       let itemTotal = 0;
//       const priceBreakdown = [];
//       let displayText = '';

//       if (fullPacks > 0) {
//         const packTotal = fullPacks * packPrice;
//         itemTotal += packTotal;
//         priceBreakdown.push({
//           type: 'pack',
//           quantity: fullPacks,
//           price: packPrice,
//           subtotal: packTotal
//         });
//         displayText += `${fullPacks} ${tablet.packaging?.packType || 'Strip'}${fullPacks > 1 ? 's' : ''}`;
//       }

//       if (looseUnits > 0) {
//         const looseTotal = looseUnits * unitPrice;
//         itemTotal += looseTotal;
//         priceBreakdown.push({
//           type: 'unit',
//           quantity: looseUnits,
//           price: unitPrice,
//           subtotal: looseTotal
//         });
//         if (displayText) displayText += ' + ';
//         displayText += `${looseUnits} ${tablet.packaging?.unitType || 'Tablet'}${looseUnits > 1 ? 's' : ''}`;
//       }

//       subtotal += itemTotal;

//       console.log(`Price calculation for ${tablet.name}:`, {
//         fullPacks,
//         looseUnits,
//         itemTotal,
//         displayText
//       });

//       billItems.push({
//         tablet: tablet._id,
//         name: tablet.name,
//         brand: tablet.brand,
//         company: tablet.company,
//         strength: tablet.strength,
//         quantity: item.quantity,
//         priceAtTime: unitPrice,
//         calculatedPrice: itemTotal,
//         priceBreakdown,
//         displayText
//       });

//       // Reduce stock - manual method for compatibility
//       try {
//         let remainingToSell = item.quantity;

//         // First use loose units
//         if (tablet.looseUnits > 0) {
//           const unitsFromLoose = Math.min(tablet.looseUnits, remainingToSell);
//           tablet.looseUnits -= unitsFromLoose;
//           remainingToSell -= unitsFromLoose;
//           console.log(`Used ${unitsFromLoose} loose units for ${tablet.name}`);
//         }

//         // Then open packs as needed
//         while (remainingToSell > 0 && tablet.stock > 0) {
//           tablet.stock -= 1;
//           tablet.looseUnits += unitsPerPack;

//           const unitsToUse = Math.min(tablet.looseUnits, remainingToSell);
//           tablet.looseUnits -= unitsToUse;
//           remainingToSell -= unitsToUse;
          
//           console.log(`Opened pack for ${tablet.name}, used ${unitsToUse} units`);
//         }

//         if (remainingToSell > 0) {
//           errors.push(`Failed to allocate stock for ${tablet.name}`);
//           continue;
//         }

//         await tablet.save();
//         console.log(`Stock updated for ${tablet.name}:`, {
//           newStock: tablet.stock,
//           newLooseUnits: tablet.looseUnits
//         });

//       } catch (stockError) {
//         console.error('Stock reduction error:', stockError);
//         errors.push(`Stock update failed for ${tablet.name}`);
//         continue;
//       }
//     }

//     // If there were errors, return them
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: errors.join('; ')
//       });
//     }

//     // If no valid items after processing
//     if (billItems.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No items could be processed'
//       });
//     }

//     // Apply discount
//     const discountPercentage = parseFloat(discount) || 0;
//     const discountAmount = subtotal * (discountPercentage / 100);
//     const total = subtotal - discountAmount;

//     console.log('Totals calculated:', {
//       subtotal,
//       discountPercentage,
//       discountAmount,
//       total
//     });

//     // Generate invoice number
//     const today = new Date();
//     const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
//     const todayStart = new Date(today.setHours(0, 0, 0, 0));
//     const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
//     const billCount = await Bill.countDocuments({
//       date: { $gte: todayStart, $lt: todayEnd }
//     });
    
//     const invoiceNumber = `INV-${dateStr}-${String(billCount + 1).padStart(4, '0')}`;
//     console.log('Generated invoice number:', invoiceNumber);

//     // Create bill
//     const bill = new Bill({
//       invoiceNumber,
//       worker: userId,
//       customerName: customerName.trim(),
//       customerPhone: customerPhone.trim(),
//       items: billItems,
//       subtotal,
//       discount: discountAmount,
//       discountPercentage,
//       total,
//       paymentMethod: paymentMethod || 'cash',
//       date: new Date()
//     });

//     await bill.save();
//     console.log('Bill saved:', bill._id);

//     // Clear cart
//     cart.items = [];
//     cart.totalItems = 0;
//     cart.totalAmount = 0;
//     await cart.save();
//     console.log('Cart cleared');

//     // Populate tablet details for response
//     await bill.populate('items.tablet', 'name brand company strength packaging');

//     res.json({
//       success: true,
//       message: 'Bill generated successfully',
//       bill
//     });

//   } catch (error) {
//     console.error('Generate bill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate bill',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// });

// // 📋 GET ALL BILLS
// router.get('/', authMiddleware, async (req, res) => {
//   try {
//     const { page = 1, limit = 20, startDate, endDate } = req.query;
//     const userId = req.user.id;

//     const query = { worker: userId };

//     if (startDate || endDate) {
//       query.date = {};
//       if (startDate) query.date.$gte = new Date(startDate);
//       if (endDate) query.date.$lte = new Date(endDate);
//     }

//     const bills = await Bill.find(query)
//       .sort({ date: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .select('invoiceNumber customerName customerPhone total date paymentMethod')
//       .lean();

//     const totalBills = await Bill.countDocuments(query);

//     res.json({
//       success: true,
//       bills,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalBills,
//         totalPages: Math.ceil(totalBills / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get bills error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch bills'
//     });
//   }
// });

// // 📄 GET SINGLE BILL
// router.get('/:id', authMiddleware, async (req, res) => {
//   try {
//     const bill = await Bill.findById(req.params.id)
//       .populate('items.tablet', 'name brand company strength packaging')
//       .populate('worker', 'name email');

//     if (!bill) {
//       return res.status(404).json({
//         success: false,
//         message: 'Bill not found'
//       });
//     }

//     res.json({
//       success: true,
//       bill
//     });

//   } catch (error) {
//     console.error('Get bill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch bill'
//     });
//   }
// });

// // 📊 GET TODAY'S BILLS
// router.get('/today', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const bills = await Bill.find({
//       worker: userId,
//       date: { $gte: today, $lt: tomorrow }
//     })
//       .sort({ date: -1 })
//       .select('invoiceNumber customerName customerPhone total date paymentMethod')
//       .lean();

//     const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);

//     res.json({
//       success: true,
//       bills,
//       stats: {
//         totalBills: bills.length,
//         totalSales
//       }
//     });

//   } catch (error) {
//     console.error('Get today bills error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch today bills'
//     });
//   }
// });

// // 📈 GET BILLS STATS
// router.get('/stats', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayBills = await Bill.find({
//       worker: userId,
//       date: { $gte: today }
//     });

//     const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
//     const monthBills = await Bill.find({
//       worker: userId,
//       date: { $gte: monthStart }
//     });

//     const todaySales = todayBills.reduce((sum, bill) => sum + bill.total, 0);
//     const monthSales = monthBills.reduce((sum, bill) => sum + bill.total, 0);

//     res.json({
//       success: true,
//       stats: {
//         today: {
//           bills: todayBills.length,
//           sales: todaySales
//         },
//         month: {
//           bills: monthBills.length,
//           sales: monthSales
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch stats'
//     });
//   }
// });

// // 📥 DOWNLOAD BILL AS PDF/PRINT
// router.get('/:id/download', authMiddleware, async (req, res) => {
//   try {
//     const bill = await Bill.findById(req.params.id)
//       .populate('items.tablet', 'name brand company strength packaging')
//       .populate('worker', 'name email');

//     if (!bill) {
//       return res.status(404).json({
//         success: false,
//         message: 'Bill not found'
//       });
//     }

//     // Check if bill belongs to user (unless admin)
//     if (bill.worker._id.toString() !== req.user.id && req.user.role !== 'owner') {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Return bill data for frontend to format
//     res.json({
//       success: true,
//       bill
//     });

//   } catch (error) {
//     console.error('Download bill error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to download bill'
//     });
//   }
// });

// module.exports = router;