// src/components/MedicineSearchWithPackaging.js - FIXED STOCK DETECTION
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchBar from './SearchBar';
import { ShoppingCart, X, Receipt, Package, Tag, Heart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import '../Styling/components/MedicineSearchPremium.css';

const MedicineSearchWithPackaging = () => {
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    startVoiceSearch,
  } = useSearch();

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalAmount } = useContext(CartContext);
  
  const searchContainerRef = useRef(null);
  const resultsDropdownRef = useRef(null);

  useEffect(() => {
    if (results.length > 0 && query.length >= 2) {
      setShowResults(true);
      setSelectedIndex(-1);
    } else if (query.length < 2) {
      setShowResults(false);
    }
  }, [results, query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddToCart = (medicine, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    addToCart(medicine, 1);
  };

  const cartTotal = getTotalAmount();
  const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const handleClearCart = () => {
    cart.items.forEach(item => removeFromCart(item._id));
  };

  const handleQuantityChange = (itemId, newQty) => {
    updateQuantity(itemId, newQty);
  };

  const calculatePriceBreakdown = (medicine, quantity) => {
    const pricing = medicine.pricing || {};
    const perTablet = pricing.perTablet || 0;
    const strip = pricing.strip || {};
    const box = pricing.box || {};
    
    const tabletsPerStrip = strip.tabletsPerStrip || 10;
    const stripsPerBox = box.stripsPerBox || 10;
    const tabletsPerBox = tabletsPerStrip * stripsPerBox;
    
    const stripPrice = strip.stripPrice || (perTablet * tabletsPerStrip);
    const boxPrice = box.boxPrice || (stripPrice * stripsPerBox);
    
    const fullBoxes = Math.floor(quantity / tabletsPerBox);
    const remainingAfterBoxes = quantity % tabletsPerBox;
    const fullStrips = Math.floor(remainingAfterBoxes / tabletsPerStrip);
    const looseTablets = remainingAfterBoxes % tabletsPerStrip;
    
    let total = 0;
    let breakdown = [];
    
    if (fullBoxes > 0) {
      total += fullBoxes * boxPrice;
      breakdown.push({
        type: 'Box',
        count: fullBoxes,
        price: boxPrice,
        total: fullBoxes * boxPrice,
        label: `${fullBoxes} Box${fullBoxes > 1 ? 'es' : ''} × ₹${boxPrice.toFixed(2)}`
      });
    }
    
    if (fullStrips > 0) {
      total += fullStrips * stripPrice;
      breakdown.push({
        type: 'Strip',
        count: fullStrips,
        price: stripPrice,
        total: fullStrips * stripPrice,
        label: `${fullStrips} Strip${fullStrips > 1 ? 's' : ''} × ₹${stripPrice.toFixed(2)}`
      });
    }
    
    if (looseTablets > 0) {
      total += looseTablets * perTablet;
      breakdown.push({
        type: 'Tablet',
        count: looseTablets,
        price: perTablet,
        total: looseTablets * perTablet,
        label: `${looseTablets} Tablet${looseTablets > 1 ? 's' : ''} × ₹${perTablet.toFixed(2)}`
      });
    }
    
    return { total, breakdown, fullBoxes, fullStrips, looseTablets };
  };

  return (
    <div className="medicine-premium-wrapper">
      <div 
        className="medicine-premium-search-container"
        ref={searchContainerRef}
      >
        <SearchBar
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          onVoiceSearch={startVoiceSearch}
          placeholder="Search medicines by name, brand, company..."
        />

        {error && (
          <div className="medicine-premium-error-alert">
            <p>Search error: {error}</p>
          </div>
        )}

        {showResults && results.length > 0 && (
          <div 
            className="medicine-premium-results-dropdown"
            ref={resultsDropdownRef}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="searchresult-premium-container">
              <div className="searchresult-premium-header">
                <p className="searchresult-premium-header-text">
                  {results.length} medicine{results.length !== 1 ? 's' : ''} found
                  {query && <span className="searchresult-premium-header-term"> for "{query}"</span>}
                </p>
                <p style={{fontSize: '11px', color: '#6B7280', marginTop: '4px'}}>
                  💊 Prices shown per tablet • Add to cart starts with 1 tablet
                </p>
              </div>
              
              <div className="searchresult-premium-list">
                {results.map((result, index) => {
                  const medicine = result.item || result;
                  const pricing = medicine.pricing || {};
                  const stock = medicine.stock || {};
                  
                  const perTablet = pricing.perTablet || 0;
                  const strip = pricing.strip || {};
                  const box = pricing.box || {};
                  
                  const tabletsPerStrip = strip.tabletsPerStrip || 10;
                  const stripsPerBox = box.stripsPerBox || 10;
                  const stripPrice = strip.stripPrice || (perTablet * tabletsPerStrip);
                  const boxPrice = box.boxPrice || (stripPrice * stripsPerBox);
                  
                  // ✅ FIXED: Calculate total available tablets from new stock structure
                  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
                  const totalTablets = medicine.totalAvailableTablets || 
                    ((stock.boxes || 0) * tabletsPerBox +
                     (stock.strips || 0) * tabletsPerStrip +
                     (stock.looseTablets || 0));
                  
                  // ✅ FIXED: Proper stock check
                  const inStock = totalTablets > 0;
                  
                  const stripSavings = strip.savingsPercent || 0;
                  const boxSavings = box.savingsPercent || 0;
                  
                  return (
                    <div
                      key={medicine._id}
                      className={`searchresult-premium-item ${
                        selectedIndex === index ? 'searchresult-premium-item--selected' : ''
                      }`}
                      onClick={() => setSelectedIndex(index)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="searchresult-premium-item-content">
                        <div className="searchresult-premium-item-main">
                          <h3 className="searchresult-premium-title">
                            <span>{medicine.name}</span>
                            {medicine.brand && (
                              <span className="searchresult-premium-brand">
                                ({medicine.brand})
                              </span>
                            )}
                          </h3>
                          
                          <div className="searchresult-premium-details">
                            <span className="searchresult-premium-company">
                              {medicine.company}
                            </span>
                            <span className="searchresult-premium-separator">•</span>
                            <span className="searchresult-premium-strength">
                              {medicine.strength}
                            </span>
                          </div>
                          
                          <div className="searchresult-premium-pricing-section">
                            <div className="searchresult-premium-price-main">
                              <span className="searchresult-premium-price-tablet">
                                ₹{perTablet.toFixed(2)}
                              </span>
                              <span className="searchresult-premium-price-unit-label">
                                per tablet
                              </span>
                            </div>
                            
                            <div className="searchresult-premium-pack-price-box">
                              <span className="searchresult-premium-pack-price-label">
                                Full Strip
                              </span>
                              <div className="searchresult-premium-pack-price-value">
                                <span className="searchresult-premium-pack-price-amount">
                                  ₹{stripPrice.toFixed(2)}
                                </span>
                                <span className="searchresult-premium-pack-price-units">
                                  ({tabletsPerStrip} tablets)
                                </span>
                              </div>
                              {stripSavings > 0 && (
                                <span className="searchresult-premium-pack-savings">
                                  Save {stripSavings.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            
                            {box.boxPrice && (
                              <div className="searchresult-premium-pack-price-box" style={{marginTop: '6px'}}>
                                <span className="searchresult-premium-pack-price-label">
                                  Full Box
                                </span>
                                <div className="searchresult-premium-pack-price-value">
                                  <span className="searchresult-premium-pack-price-amount">
                                    ₹{boxPrice.toFixed(2)}
                                  </span>
                                  <span className="searchresult-premium-pack-price-units">
                                    ({stripsPerBox} strips = {tabletsPerBox} tablets)
                                  </span>
                                </div>
                                {boxSavings > 0 && (
                                  <span className="searchresult-premium-pack-savings">
                                    Save {boxSavings.toFixed(1)}% • Best Value!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {inStock ? (
                            <div className="searchresult-premium-stock-detailed">
                              <Package className="w-4 h-4" />
                              <span className="searchresult-premium-stock-available">
                                ✓ {totalTablets} tablets available
                              </span>
                              <span className="searchresult-premium-stock-breakdown">
                                ({stock.boxes || 0} boxes, {stock.strips || 0} strips, {stock.looseTablets || 0} loose)
                              </span>
                            </div>
                          ) : (
                            <div className="searchresult-premium-stock-out">
                              <X className="w-4 h-4" />
                              <span>Out of Stock</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="searchresult-premium-action">
                          <button
                            onClick={(e) => handleAddToCart(medicine, e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={!inStock}
                            className="searchresult-premium-btn-add"
                            style={{
                              opacity: inStock ? 1 : 0.5,
                              cursor: inStock ? 'pointer' : 'not-allowed',
                              background: !inStock 
                                ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)' 
                                : undefined
                            }}
                          >
                            <ShoppingCart className="searchresult-premium-btn-icon" />
                            {inStock ? 'Add 1 Tablet' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="medicine-premium-cart-container">
        <div className="medicine-premium-cart-header">
          <h2 className="medicine-premium-cart-title">
            <ShoppingCart className="medicine-premium-cart-icon" />
            Shopping Cart
            {cartItemCount > 0 && (
              <span className="medicine-premium-cart-badge">{cartItemCount}</span>
            )}
          </h2>
          
          <div style={{display: 'flex', gap: '8px'}}>
            {cart.savedItems?.length > 0 && (
              <button 
                onClick={() => window.location.href = '/worker/saved-items'}
                className="medicine-premium-saved-btn"
              >
                <Heart className="w-4 h-4" style={{fill: '#92400E'}} />
                Saved ({cart.savedItems.length})
              </button>
            )}
            
            {cart.items.length > 0 && (
              <button onClick={handleClearCart} className="medicine-premium-clear-btn">
                <X className="medicine-premium-clear-icon" />
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cart.items.length === 0 ? (
          <div className="medicine-premium-empty-state">
            <ShoppingCart className="medicine-premium-empty-icon" />
            <p className="medicine-premium-empty-text">Your cart is empty</p>
            <p className="medicine-premium-empty-subtext">Search and add medicines above</p>
          </div>
        ) : (
          <>
            <div className="medicine-premium-cart-items">
              {cart.items.map((item) => {
                const medicine = item.tablet;
                const priceCalc = calculatePriceBreakdown(medicine, item.quantity);
                
                return (
                  <div key={item._id} className="medicine-premium-cart-item-detailed">
                    <div className="medicine-premium-item-header">
                      <div className="medicine-premium-item-info">
                        <span className="medicine-premium-item-name">{medicine?.name}</span>
                        <span className="medicine-premium-item-brand">({medicine?.brand})</span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="medicine-premium-remove-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {priceCalc && (
                      <div className="medicine-premium-packaging-breakdown">
                        <Tag className="w-3 h-3" style={{color: '#6366F1'}} />
                        <div className="medicine-premium-breakdown-text">
                          {priceCalc.fullBoxes > 0 && (
                            <span>{priceCalc.fullBoxes} Box{priceCalc.fullBoxes > 1 ? 'es' : ''}</span>
                          )}
                          {priceCalc.fullStrips > 0 && (
                            <span>
                              {priceCalc.fullBoxes > 0 && ' + '}
                              {priceCalc.fullStrips} Strip{priceCalc.fullStrips > 1 ? 's' : ''}
                            </span>
                          )}
                          {priceCalc.looseTablets > 0 && (
                            <span>
                              {(priceCalc.fullBoxes > 0 || priceCalc.fullStrips > 0) && ' + '}
                              {priceCalc.looseTablets} Tablet{priceCalc.looseTablets > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="medicine-premium-item-controls">
                      <div className="medicine-premium-quantity-controls">
                        <button
                          className="medicine-premium-qty-btn"
                          onClick={() => handleQuantityChange(item._id, Math.max(item.quantity - 1, 1))}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="medicine-premium-qty-value">{item.quantity}</span>
                        <button
                          className="medicine-premium-qty-btn medicine-premium-qty-btn-add"
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="medicine-premium-item-pricing">
                        {priceCalc ? (
                          <>
                            <div className="medicine-premium-price-breakdown">
                              {priceCalc.breakdown.map((item, idx) => (
                                <div key={idx} className="medicine-premium-breakdown-line">
                                  {item.label}
                                </div>
                              ))}
                            </div>
                            <div className="medicine-premium-item-total">
                              Total: ₹{priceCalc.total.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="medicine-premium-item-price">
                            ₹{((medicine?.pricing?.perTablet || 0) * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="medicine-premium-cart-footer">
              <div className="medicine-premium-cart-summary">
                <div className="medicine-premium-summary-item">
                  <span className="medicine-premium-summary-label">Total Tablets: </span>
                  <span className="medicine-premium-summary-value">{cartItemCount}</span>
                </div>
                <div className="medicine-premium-cart-total">
                  Total: ₹{cartTotal.toFixed(2)}
                </div>
              </div>
              <div className="medicine-premium-action-buttons">
                <button className="medicine-premium-btn medicine-premium-btn-primary">
                  <Receipt className="medicine-premium-btn-icon" />
                  Generate Bill
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MedicineSearchWithPackaging;