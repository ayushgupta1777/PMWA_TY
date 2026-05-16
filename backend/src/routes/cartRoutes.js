// backend/src/routes/cartRoutes.js - COMPLETE FIXED VERSION WITH NEW PRICING
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Tablet = require('../models/Tablet');
const authMiddleware = require('../middleware/authMiddleware');

// 🛒 GET USER CART
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ worker: userId })
      .populate({
        path: 'items.tablet',
        select: 'name brand company strength pricing stock category description isActive dosageForm'
      })
      .lean();

    if (!cart) {
      cart = {
        worker: userId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        savedItems: [],
        updatedAt: new Date()
      };
      
      return res.json({ success: true, cart });
    }

    // Calculate totals with new pricing structure
    let totalItems = 0;
    let totalAmount = 0;

    cart.items = cart.items.filter(item => {
      if (!item.tablet || !item.tablet.isActive) {
        return false;
      }

      const tablet = item.tablet;
      const pricing = tablet.pricing || {};
      const stock = tablet.stock || {};
      
      // Get pricing details
      const perTablet = pricing.perTablet || 0;
      const strip = pricing.strip || {};
      const box = pricing.box || {};
      
      const tabletsPerStrip = strip.tabletsPerStrip || 10;
      const stripsPerBox = box.stripsPerBox || 10;
      const tabletsPerBox = tabletsPerStrip * stripsPerBox;
      
      const stripPrice = strip.stripPrice || (perTablet * tabletsPerStrip);
      const boxPrice = box.boxPrice || (stripPrice * stripsPerBox);
      
      // Calculate total available tablets
      const totalAvailableTablets = 
        (stock.boxes || 0) * tabletsPerBox +
        (stock.strips || 0) * tabletsPerStrip +
        (stock.looseTablets || 0);
      
      if (totalAvailableTablets === 0) {
        return false; // Remove out of stock items
      }
      
      // Adjust quantity if exceeds available
      if (item.quantity > totalAvailableTablets) {
        item.quantity = totalAvailableTablets;
      }
      
      // Calculate optimal breakdown (boxes + strips + tablets)
      const fullBoxes = Math.floor(item.quantity / tabletsPerBox);
      const remainingAfterBoxes = item.quantity % tabletsPerBox;
      const fullStrips = Math.floor(remainingAfterBoxes / tabletsPerStrip);
      const looseTablets = remainingAfterBoxes % tabletsPerStrip;
      
      let itemTotal = 0;
      const breakdown = [];
      const displayParts = [];
      
      // Add boxes
      if (fullBoxes > 0) {
        const boxTotal = fullBoxes * boxPrice;
        itemTotal += boxTotal;
        breakdown.push({
          type: 'Box',
          quantity: fullBoxes,
          price: boxPrice,
          subtotal: boxTotal
        });
        displayParts.push(`${fullBoxes} Box${fullBoxes > 1 ? 'es' : ''}`);
      }
      
      // Add strips
      if (fullStrips > 0) {
        const stripTotal = fullStrips * stripPrice;
        itemTotal += stripTotal;
        breakdown.push({
          type: 'Strip',
          quantity: fullStrips,
          price: stripPrice,
          subtotal: stripTotal
        });
        displayParts.push(`${fullStrips} Strip${fullStrips > 1 ? 's' : ''}`);
      }
      
      // Add loose tablets
      if (looseTablets > 0) {
        const tabletTotal = looseTablets * perTablet;
        itemTotal += tabletTotal;
        breakdown.push({
          type: 'Tablet',
          quantity: looseTablets,
          price: perTablet,
          subtotal: tabletTotal
        });
        displayParts.push(`${looseTablets} Tablet${looseTablets > 1 ? 's' : ''}`);
      }
      
      // Store calculated values
      item.calculatedPrice = itemTotal;
      item.priceBreakdown = breakdown;
      item.displayText = displayParts.join(' + ');
      item.perUnitPrice = perTablet;
      item.stripPrice = stripPrice;
      item.boxPrice = boxPrice;
      
      // Add availability info
      item.tablet.totalAvailable = totalAvailableTablets;
      item.tablet.inStock = totalAvailableTablets > 0;
      
      totalItems += item.quantity;
      totalAmount += itemTotal;
      
      return true;
    });

    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    res.json({
      success: true,
      cart
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// ➕ ADD ITEM TO CART
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { tabletId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!tabletId) {
      return res.status(400).json({ 
        success: false,
        message: 'Tablet ID is required' 
      });
    }

    if (quantity < 1 || quantity > 10000) {
      return res.status(400).json({ 
        success: false,
        message: 'Quantity must be between 1 and 10000' 
      });
    }

    const tablet = await Tablet.findById(tabletId);
    if (!tablet) {
      return res.status(404).json({ 
        success: false,
        message: 'Medicine not found' 
      });
    }

    if (!tablet.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Medicine is not available' 
      });
    }

    const pricing = tablet.pricing || {};
    const stock = tablet.stock || {};
    const strip = pricing.strip || {};
    const box = pricing.box || {};
    
    const perTablet = pricing.perTablet || 0;
    const tabletsPerStrip = strip.tabletsPerStrip || 10;
    const stripsPerBox = box.stripsPerBox || 10;
    const tabletsPerBox = tabletsPerStrip * stripsPerBox;
    
    // Calculate total available
    const totalAvailable = 
      (stock.boxes || 0) * tabletsPerBox +
      (stock.strips || 0) * tabletsPerStrip +
      (stock.looseTablets || 0);
    
    if (totalAvailable < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Only ${totalAvailable} tablets available`,
        availableStock: totalAvailable
      });
    }

    let cart = await Cart.findOne({ worker: userId });
    if (!cart) {
      cart = new Cart({ worker: userId, items: [], savedItems: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.tablet.toString() === tabletId
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (totalAvailable < newQuantity) {
        return res.status(400).json({ 
          success: false,
          message: `Cannot add ${quantity} more. Only ${totalAvailable - cart.items[existingItemIndex].quantity} tablets available`,
          availableStock: totalAvailable
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].updatedAt = new Date();
    } else {
      cart.items.push({
        tablet: tabletId,
        quantity,
        priceAtTime: perTablet,
        addedAt: new Date()
      });
    }

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate({
      path: 'items.tablet',
      select: 'name brand company strength pricing stock category dosageForm'
    });

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
});

// 🔢 UPDATE CART ITEM QUANTITY
router.put('/update/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'Quantity must be at least 1' 
      });
    }

    const cart = await Cart.findOne({ worker: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    const tablet = await Tablet.findById(cart.items[itemIndex].tablet);
    if (!tablet || !tablet.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Medicine is no longer available' 
      });
    }

    const pricing = tablet.pricing || {};
    const stock = tablet.stock || {};
    const strip = pricing.strip || {};
    const box = pricing.box || {};
    
    const tabletsPerStrip = strip.tabletsPerStrip || 10;
    const stripsPerBox = box.stripsPerBox || 10;
    const tabletsPerBox = tabletsPerStrip * stripsPerBox;
    
    const totalAvailable = 
      (stock.boxes || 0) * tabletsPerBox +
      (stock.strips || 0) * tabletsPerStrip +
      (stock.looseTablets || 0);
    
    if (totalAvailable < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Only ${totalAvailable} tablets available`,
        availableStock: totalAvailable
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].updatedAt = new Date();

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate({
      path: 'items.tablet',
      select: 'name brand company strength pricing stock category dosageForm'
    });

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
});

// ❌ REMOVE ITEM FROM CART
router.delete('/remove/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ worker: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    cart.items.splice(itemIndex, 1);
    await updateCartTotals(cart);
    await cart.save();

    await cart.populate({
      path: 'items.tablet',
      select: 'name brand company strength pricing stock category dosageForm'
    });

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
});

// 🗑️ CLEAR ENTIRE CART
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ worker: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

// 🔄 SYNC CART
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ worker: userId });
    
    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        message: 'Cart is empty',
        cart: { items: [], totalItems: 0, totalAmount: 0, savedItems: [] }
      });
    }

    let hasChanges = false;
    const unavailableItems = [];

    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];
      const tablet = await Tablet.findById(item.tablet);

      if (!tablet || !tablet.isActive) {
        unavailableItems.push({
          name: 'Unknown medicine',
          reason: 'No longer available'
        });
        cart.items.splice(i, 1);
        hasChanges = true;
        continue;
      }

      const pricing = tablet.pricing || {};
      const stock = tablet.stock || {};
      const strip = pricing.strip || {};
      const box = pricing.box || {};
      
      const tabletsPerStrip = strip.tabletsPerStrip || 10;
      const stripsPerBox = box.stripsPerBox || 10;
      const tabletsPerBox = tabletsPerStrip * stripsPerBox;
      
      const totalAvailable = 
        (stock.boxes || 0) * tabletsPerBox +
        (stock.strips || 0) * tabletsPerStrip +
        (stock.looseTablets || 0);
      
      if (totalAvailable === 0) {
        cart.items.splice(i, 1);
        hasChanges = true;
        unavailableItems.push({
          name: tablet.name,
          reason: 'Out of stock'
        });
      } else if (totalAvailable < item.quantity) {
        item.quantity = totalAvailable;
        hasChanges = true;
        unavailableItems.push({
          name: tablet.name,
          reason: `Quantity reduced to ${totalAvailable} tablets`
        });
      }

      // Update price if changed
      const currentPrice = pricing.perTablet || 0;
      if (Math.abs(currentPrice - item.priceAtTime) > 0.01) {
        item.priceAtTime = currentPrice;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await updateCartTotals(cart);
      await cart.save();
    }

    await cart.populate({
      path: 'items.tablet',
      select: 'name brand company strength pricing stock category dosageForm'
    });

    res.json({
      success: true,
      message: hasChanges ? 'Cart has been updated' : 'Cart is up to date',
      cart,
      changes: {
        hasChanges,
        unavailableItems
      }
    });

  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync cart',
      error: error.message
    });
  }
});

// 💾 SAVE FOR LATER
router.post('/save-for-later', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ worker: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const savedItem = cart.items[itemIndex];
    
    if (!cart.savedItems) {
      cart.savedItems = [];
    }

    cart.savedItems.push({
      tablet: savedItem.tablet,
      quantity: savedItem.quantity,
      priceAtTime: savedItem.priceAtTime,
      savedAt: new Date()
    });
    
    cart.items.splice(itemIndex, 1);

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate({
      path: 'items.tablet savedItems.tablet',
      select: 'name brand company strength pricing stock category'
    });

    res.json({
      success: true,
      message: 'Item saved for later',
      cart
    });

  } catch (error) {
    console.error('Save for later error:', error);
    res.status(500).json({ success: false, message: 'Failed to save item' });
  }
});

// 🛒 MOVE TO CART
router.post('/move-to-cart', authMiddleware, async (req, res) => {
  try {
    const { savedItemId } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ worker: userId });
    if (!cart || !cart.savedItems) {
      return res.status(404).json({ success: false, message: 'No saved items found' });
    }

    const savedItemIndex = cart.savedItems.findIndex(
      item => item._id.toString() === savedItemId
    );
    
    if (savedItemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Saved item not found' });
    }

    const savedItem = cart.savedItems[savedItemIndex];
    
    cart.items.push({
      tablet: savedItem.tablet,
      quantity: savedItem.quantity,
      priceAtTime: savedItem.priceAtTime,
      addedAt: new Date()
    });
    
    cart.savedItems.splice(savedItemIndex, 1);

    await updateCartTotals(cart);
    await cart.save();

    await cart.populate({
      path: 'items.tablet savedItems.tablet',
      select: 'name brand company strength pricing stock category'
    });

    res.json({
      success: true,
      message: 'Item moved back to cart',
      cart
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to move item' });
  }
});

// ✅ Helper: Update cart totals with new pricing structure
async function updateCartTotals(cart) {
  let totalItems = 0;
  let totalAmount = 0;

  for (const item of cart.items) {
    totalItems += item.quantity;
    
    const tablet = await Tablet.findById(item.tablet);
    if (tablet) {
      const pricing = tablet.pricing || {};
      const strip = pricing.strip || {};
      const box = pricing.box || {};
      
      const perTablet = pricing.perTablet || 0;
      const tabletsPerStrip = strip.tabletsPerStrip || 10;
      const stripsPerBox = box.stripsPerBox || 10;
      const tabletsPerBox = tabletsPerStrip * stripsPerBox;
      
      const stripPrice = strip.stripPrice || (perTablet * tabletsPerStrip);
      const boxPrice = box.boxPrice || (stripPrice * stripsPerBox);

      // Calculate optimal breakdown
      const fullBoxes = Math.floor(item.quantity / tabletsPerBox);
      const remainingAfterBoxes = item.quantity % tabletsPerBox;
      const fullStrips = Math.floor(remainingAfterBoxes / tabletsPerStrip);
      const looseTablets = remainingAfterBoxes % tabletsPerStrip;

      let itemTotal = 0;
      
      if (fullBoxes > 0) {
        itemTotal += fullBoxes * boxPrice;
      }
      
      if (fullStrips > 0) {
        itemTotal += fullStrips * stripPrice;
      }
      
      if (looseTablets > 0) {
        itemTotal += looseTablets * perTablet;
      }

      totalAmount += itemTotal;
      item.priceAtTime = perTablet;
    }
  }

  cart.totalItems = totalItems;
  cart.totalAmount = Math.round(totalAmount * 100) / 100;
  cart.updatedAt = new Date();
}

module.exports = router;