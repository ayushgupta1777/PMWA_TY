export const cartUtils = {
  // Calculate cart totals
  calculateTotals: (items = []) => {
    const subtotal = items.reduce((total, item) => {
      const price = item.tablet?.price || item.priceAtTime || 0;
      return total + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.05; // 5% tax
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    return {
      subtotal,
      tax,
      totalItems,
      uniqueItems: items.length,
      total: subtotal + tax
    };
  },

  // Validate cart items
  validateCartItems: (items = []) => {
    const issues = [];

    items.forEach((item, index) => {
      if (!item.tablet) {
        issues.push({
          index,
          type: 'missing_tablet',
          message: 'Medicine information is missing'
        });
      } else {
        if (item.tablet.stock === 0) {
          issues.push({
            index,
            type: 'out_of_stock',
            message: `${item.tablet.name} is out of stock`
          });
        } else if (item.tablet.stock < item.quantity) {
          issues.push({
            index,
            type: 'insufficient_stock',
            message: `Only ${item.tablet.stock} ${item.tablet.name} available, but ${item.quantity} requested`
          });
        }

        if (!item.tablet.isActive) {
          issues.push({
            index,
            type: 'inactive',
            message: `${item.tablet.name} is no longer available`
          });
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Generate cart summary text
  generateCartSummaryText: (cart) => {
    if (!cart || !cart.items?.length) {
      return 'Your cart is empty';
    }

    const { totalItems, uniqueItems } = cartUtils.calculateTotals(cart.items);
    
    if (uniqueItems === 1) {
      return `${totalItems} item${totalItems > 1 ? 's' : ''} in cart`;
    }
    
    return `${uniqueItems} medicines (${totalItems} items) in cart`;
  },

  // Check if cart needs sync
  needsSync: (cart, lastSyncTime = null) => {
    if (!cart || !cart.items?.length) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const cartLastUpdated = new Date(cart.updatedAt || cart.lastSyncedAt);
    
    return cartLastUpdated < fiveMinutesAgo;
  },

  // Get cart warnings
  getCartWarnings: (cart) => {
    const warnings = [];
    
    if (!cart || !cart.items?.length) return warnings;

    const validation = cartUtils.validateCartItems(cart.items);
    
    validation.issues.forEach(issue => {
      warnings.push({
        type: issue.type,
        message: issue.message,
        severity: issue.type === 'out_of_stock' ? 'error' : 'warning'
      });
    });

    // Check for price changes
    cart.items.forEach(item => {
      if (item.tablet && item.tablet.price !== item.priceAtTime) {
        const priceDiff = item.tablet.price - item.priceAtTime;
        const changeType = priceDiff > 0 ? 'increased' : 'decreased';
        
        warnings.push({
          type: 'price_change',
          message: `Price of ${item.tablet.name} has ${changeType} from ₹${item.priceAtTime} to ₹${item.tablet.price}`,
          severity: 'info'
        });
      }
    });

    return warnings;
  }
};
