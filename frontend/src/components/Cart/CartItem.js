// src/components/Cart/CartItem.js - FIXED FOR NEW PRICING STRUCTURE
import React, { useState } from 'react';
import { AlertCircle, Minus, Plus, Heart, Trash2, Package } from 'lucide-react';
import '../../Styling/components/Cart/CartItemPremium.css';

const CartItem = ({ item, onUpdateQuantity, onRemoveItem, onSaveForLater }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const tablet = item.tablet;
  const pricing = tablet?.pricing || {};
  const stock = tablet?.stock || {};
  const strip = pricing.strip || {};
  const box = pricing.box || {};
  
  // Get pricing details
  const perTablet = pricing.perTablet || 0;
  const tabletsPerStrip = strip.tabletsPerStrip || 10;
  const stripsPerBox = box.stripsPerBox || 10;
  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
  
  const stripPrice = strip.stripPrice || (perTablet * tabletsPerStrip);
  const boxPrice = box.boxPrice || (stripPrice * stripsPerBox);
  
  // Calculate total available
  const totalAvailable = 
    (stock.boxes || 0) * tabletsPerBox +
    (stock.strips || 0) * tabletsPerStrip +
    (stock.looseTablets || 0);
  
  const isOutOfStock = totalAvailable === 0;
  const isLowStock = totalAvailable > 0 && totalAvailable < 20;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > totalAvailable) return;
    
    try {
      setUpdating(true);
      setQuantity(newQuantity);
      await onUpdateQuantity(item._id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setQuantity(item.quantity);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= totalAvailable) {
      handleQuantityChange(value);
    }
  };

  // Use calculated price from backend or calculate if not available
  const totalPrice = item.calculatedPrice || (perTablet * quantity);

  return (
    <div className={`cart-item-premium-container ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="cart-item-premium-info-section">
        <div className="cart-item-premium-details">
          <div className="cart-item-premium-header">
            <div>
              <h3 className="cart-item-premium-title">{tablet?.name}</h3>
              <p className="cart-item-premium-meta">
                {tablet?.brand} • {tablet?.company}
              </p>
              <span className="cart-item-premium-strength">
                {tablet?.strength}
              </span>
            </div>
            
            <div className="cart-item-premium-price-box">
              <p className="cart-item-premium-price">
                ₹{perTablet.toFixed(2)}
              </p>
              <span className="cart-item-premium-unit-label">per tablet</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div style={{
            background: '#F3F4F6',
            padding: '10px 12px',
            borderRadius: '8px',
            marginTop: '12px',
            fontSize: '13px',
            color: '#374151'
          }}>
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
              <div>
                <span style={{color: '#6B7280', fontWeight: '500'}}>Strip Price:</span>
                <span style={{marginLeft: '6px', fontWeight: '600'}}>₹{stripPrice.toFixed(2)}</span>
                <span style={{color: '#6B7280', fontSize: '12px', marginLeft: '4px'}}>
                  ({tabletsPerStrip} tablets)
                </span>
              </div>
              {box.boxPrice && (
                <div>
                  <span style={{color: '#6B7280', fontWeight: '500'}}>Box Price:</span>
                  <span style={{marginLeft: '6px', fontWeight: '600'}}>₹{boxPrice.toFixed(2)}</span>
                  <span style={{color: '#6B7280', fontSize: '12px', marginLeft: '4px'}}>
                    ({stripsPerBox} strips = {tabletsPerBox} tablets)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Alert */}
          {isOutOfStock && (
            <div className="cart-item-premium-alert">
              <AlertCircle size={18} />
              <span>Out of stock - Please remove this item</span>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <div className="cart-item-premium-alert" style={{ 
              background: 'rgba(251, 191, 36, 0.08)',
              borderColor: '#FCD34D',
              color: '#D97706'
            }}>
              <AlertCircle size={18} />
              <span>Only {totalAvailable} tablets left in stock</span>
            </div>
          )}

          {/* Display Text - Shows breakdown */}
          {item.displayText && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: '#EEF2FF',
              borderRadius: '6px',
              marginTop: '12px',
              fontSize: '14px',
              color: '#4338CA',
              fontWeight: '500'
            }}>
              <Package size={18} />
              <span>{item.displayText}</span>
            </div>
          )}

          {/* Price Breakdown */}
          {item.priceBreakdown && item.priceBreakdown.length > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Price Breakdown:
              </p>
              {item.priceBreakdown.map((breakdown, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  fontSize: '13px',
                  color: '#374151'
                }}>
                  <span>
                    {breakdown.quantity} {breakdown.type}
                    {breakdown.quantity > 1 ? 's' : ''} × ₹{breakdown.price.toFixed(2)}
                  </span>
                  <span style={{fontWeight: '600'}}>
                    ₹{breakdown.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="cart-item-premium-controls">
            <div className="cart-item-premium-quantity-section">
              <span className="cart-item-premium-quantity-label">Quantity (Tablets):</span>
              
              <div className="cart-item-premium-quantity-controls">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || isOutOfStock || updating}
                  className="cart-item-premium-qty-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                
                <input
                  type="number"
                  value={quantity}
                  onChange={handleInputChange}
                  disabled={isOutOfStock || updating}
                  className="cart-item-premium-qty-input"
                  min="1"
                  max={totalAvailable}
                />
                
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= totalAvailable || isOutOfStock || updating}
                  className="cart-item-premium-qty-btn"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="cart-item-premium-total-price">
              <p className="cart-item-premium-total-amount">
                ₹{totalPrice.toFixed(2)}
              </p>
              <span className="cart-item-premium-breakdown">
                {item.displayText || `${quantity} × ₹${perTablet.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="cart-item-premium-actions">
            <button
              onClick={() => onSaveForLater(item._id)}
              className="cart-item-premium-action-btn save"
              disabled={updating}
            >
              {updating ? (
                <div className="cart-item-premium-spinner" />
              ) : (
                <Heart size={18} />
              )}
              <span>Save for Later</span>
            </button>
            
            <button
              onClick={() => onRemoveItem(item._id)}
              className="cart-item-premium-action-btn remove"
              disabled={updating}
            >
              {updating ? (
                <div className="cart-item-premium-spinner" />
              ) : (
                <Trash2 size={18} />
              )}
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;