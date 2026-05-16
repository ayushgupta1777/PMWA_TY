import React from 'react';
import { ShoppingCart, Package, CreditCard, Info, Tag } from 'lucide-react';
import '../../Styling/components/Cart/CartSummaryPremium.css';

const CartSummary = ({ cart, onCheckout, isCheckingOut }) => {
  // Calculate totals from backend
  const subtotal = cart?.totalAmount || 0;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;
  const totalTablets = cart?.totalItems || 0;

  return (
    <div className="cart-summary-premium-container">
      {/* Header */}
      <div className="cart-summary-premium-header">
        <ShoppingCart className="cart-summary-premium-icon" />
        <h3 className="cart-summary-premium-title">Order Summary</h3>
      </div>

      {/* Summary Stats */}
      <div className="cart-summary-premium-stats">
        <div className="cart-summary-premium-stat-row">
          <span className="cart-summary-premium-stat-label">
            <Package size={16} />
            <span>Total Tablets</span>
          </span>
          <span className="cart-summary-premium-stat-value">{totalTablets}</span>
        </div>
        
        <div className="cart-summary-premium-stat-row">
          <span className="cart-summary-premium-stat-label">
            <Tag size={16} />
            <span>Unique Medicines</span>
          </span>
          <span className="cart-summary-premium-stat-value">
            {cart?.items?.length || 0}
          </span>
        </div>
      </div>

      {/* Order Breakdown */}
      {cart?.items && cart.items.length > 0 && (
        <div className="cart-summary-premium-breakdown">
          <p className="cart-summary-premium-breakdown-title">Your Order:</p>
          <div className="cart-summary-premium-breakdown-list">
            {cart.items.map((item, index) => (
              <div key={index} className="cart-summary-premium-breakdown-item">
                {item.displayText && (
                  <span>• {item.tablet?.name}: {item.displayText}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="cart-summary-premium-pricing">
        <div className="cart-summary-premium-price-row">
          <span className="cart-summary-premium-price-label">Subtotal</span>
          <span className="cart-summary-premium-price-value">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>
        
        <div className="cart-summary-premium-price-row">
          <span className="cart-summary-premium-price-label">Tax (5%)</span>
          <span className="cart-summary-premium-price-value">
            ₹{tax.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="cart-summary-premium-total-row">
        <span className="cart-summary-premium-total-label">Total</span>
        <span className="cart-summary-premium-total-value">
          ₹{total.toFixed(2)}
        </span>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={!cart?.items?.length || isCheckingOut}
        className="cart-summary-premium-checkout-btn"
      >
        {isCheckingOut ? (
          <>
            <div className="cart-summary-premium-spinner"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Proceed to Billing</span>
          </>
        )}
      </button>

      {/* Additional Info */}
      <div className="cart-summary-premium-info">
        <div className="cart-summary-premium-info-box">
          <Info size={16} className="cart-summary-premium-info-icon" />
          <div className="cart-summary-premium-info-text">
            <p>• Prices calculated based on strip/tablet purchase</p>
            <p>• Strip pricing applied automatically</p>
            <p>• Stock verified at checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;