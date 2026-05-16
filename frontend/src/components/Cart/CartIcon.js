// src/components/Cart/CartIcon.js
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import '../../Styling/components/Cart/CartIconPremium.css'; // ✅ ADD THIS

const CartIcon = ({ onClick, className = '' }) => {
  const { getCartSummary } = useCart();
  const { totalItems } = getCartSummary();

  return (
    <button
      onClick={onClick}
      className={`cart-icon-premium-button ${className}`} // ✅ CHANGED
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="cart-icon-premium-badge"> {/* ✅ CHANGED */}
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};

export default CartIcon;