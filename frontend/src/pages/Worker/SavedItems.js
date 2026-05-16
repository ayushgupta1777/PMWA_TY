// src/pages/Worker/SavedItemsPage.js - FIXED TABLET PRICING
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingCart, Trash2, AlertTriangle, Package, Tag } from 'lucide-react';
import { cartService } from '../../services/cartService';
import '../../Styling/pages/Worker/SavedItemsPremium.css';

const SavedItemsPage = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setSavedItems(response.cart?.savedItems || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
      setError('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToCart = async (savedItemId) => {
    try {
      await cartService.moveToCart(savedItemId);
      setSavedItems(prev => prev.filter(item => item._id !== savedItemId));
    } catch (error) {
      console.error('Failed to move item to cart:', error);
      setError('Failed to move item to cart');
    }
  };

  const handleRemoveItem = async (savedItemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await cartService.removeItem(savedItemId);
        setSavedItems(prev => prev.filter(item => item._id !== savedItemId));
      } catch (error) {
        console.error('Failed to remove item:', error);
        setError('Failed to remove item');
      }
    }
  };

  if (loading) {
    return (
      <div className="saveditems-premium-page">
        <div className="saveditems-premium-loading">
          <div className="saveditems-premium-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="saveditems-premium-page">
      {/* Header */}
      <div className="saveditems-premium-header">
        <div className="saveditems-premium-header-content">
          <div className="saveditems-premium-header-inner">
            <div className="saveditems-premium-header-left">
              <button
                onClick={() => navigate(-1)}
                className="saveditems-premium-back-btn"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              
              <div className="saveditems-premium-title-wrapper">
                <Heart className="saveditems-premium-heart-icon" />
                <h1 className="saveditems-premium-title">
                  Saved Items
                  {savedItems.length > 0 && (
                    <span className="saveditems-premium-count">
                      ({savedItems.length} {savedItems.length === 1 ? 'item' : 'items'})
                    </span>
                  )}
                </h1>
              </div>
            </div>

            {savedItems.length > 0 && (
              <button
                onClick={() => navigate('/worker/cart')}
                className="saveditems-premium-cart-btn"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>View Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="saveditems-premium-error">
          <div className="saveditems-premium-error-box">
            <div className="saveditems-premium-error-content">
              <AlertTriangle className="saveditems-premium-error-icon" />
              <span className="saveditems-premium-error-text">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="saveditems-premium-error-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="saveditems-premium-content">
        {savedItems.length === 0 ? (
          /* Empty State */
          <div className="saveditems-premium-empty">
            <Heart className="saveditems-premium-empty-icon" />
            <h2 className="saveditems-premium-empty-title">No saved items</h2>
            <p className="saveditems-premium-empty-text">
              Items you save for later will appear here
            </p>
            <button
              onClick={() => navigate('/worker/dashboard')}
              className="saveditems-premium-browse-btn"
            >
              Browse Medicines
            </button>
          </div>
        ) : (
          /* Saved Items Grid */
          <div className="saveditems-premium-grid">
            {savedItems.map((item) => (
              <SavedItemCard
                key={item._id}
                item={item}
                onMoveToCart={handleMoveToCart}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SavedItemCard = ({ item, onMoveToCart, onRemove }) => {
  // ✅ Calculate TABLET pricing
  const unitsPerPack = item.tablet?.packaging?.unitsPerPack || 10;
  const packPrice = item.tablet?.packaging?.packPrice || item.tablet?.price || item.priceAtTime || 0;
  const unitPrice = item.tablet?.packaging?.unitPrice || (packPrice / unitsPerPack) || 0;
  
  // ✅ Total availability in TABLETS
  const totalTablets = (item.tablet?.stock * unitsPerPack) + (item.tablet?.looseUnits || 0);
  const isOutOfStock = totalTablets === 0;

  return (
    <div className={`saveditems-premium-card ${
      isOutOfStock ? 'saveditems-premium-card-out-of-stock' : ''
    }`}>
      {/* Medicine Info */}
      <div className="saveditems-premium-medicine-info">
        <div className="saveditems-premium-medicine-header">
          <h3 className="saveditems-premium-medicine-name">
            {item.tablet?.name || 'Unknown Medicine'}
          </h3>
          {isOutOfStock && (
            <span className="saveditems-premium-out-of-stock-badge">
              Out of Stock
            </span>
          )}
        </div>
        
        <p className="saveditems-premium-medicine-brand">
          {item.tablet?.brand} • {item.tablet?.company}
        </p>
        
        <p className="saveditems-premium-medicine-strength">
          Strength: {item.tablet?.strength}
        </p>
      </div>

      {/* ✅ FIXED: Price Display - SHOW TABLET PRICE */}
      <div className="saveditems-premium-price-section">
        <div className="saveditems-premium-price-row">
          <div className="saveditems-premium-price-left">
            <p className="saveditems-premium-price">
              ₹{unitPrice.toFixed(2)}
            </p>
            <p className="saveditems-premium-price-label">per tablet</p>
          </div>
          
          {!isOutOfStock && (
            <div className="saveditems-premium-stock-info">
              <div className="saveditems-premium-stock-row">
                <Package className="saveditems-premium-stock-icon" />
                <span className="saveditems-premium-stock-number">{totalTablets}</span>
              </div>
              <p className="saveditems-premium-stock-label">tablets available</p>
            </div>
          )}
        </div>

        {/* ✅ Pack Info */}
        <div style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: '#F3F4F6',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#6B7280'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <Tag className="w-3 h-3" style={{color: '#6366F1'}} />
            <span>
              Pack: ₹{packPrice.toFixed(2)} ({unitsPerPack} tablets)
            </span>
          </div>
        </div>
      </div>

      {/* Saved Info */}
      <div className="saveditems-premium-saved-date">
        Saved on {new Date(item.addedAt || item.savedAt).toLocaleDateString()}
      </div>

      {/* Action Buttons */}
      <div className="saveditems-premium-actions">
        <button
          onClick={() => onMoveToCart(item._id)}
          disabled={isOutOfStock}
          className="saveditems-premium-move-btn"
        >
          <ShoppingCart className="saveditems-premium-move-icon" />
          <span>Move to Cart</span>
        </button>
        
        <button
          onClick={() => onRemove(item._id)}
          className="saveditems-premium-remove-btn"
          title="Remove from saved items"
        >
          <Trash2 className="saveditems-premium-remove-icon" />
        </button>
      </div>
    </div>
  );
};

export default SavedItemsPage;