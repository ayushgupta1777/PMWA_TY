import React from 'react';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import '../../Styling/components/Cart/SavedItemsPremium.css'; // ✅ ADD THIS

const SavedItems = ({ savedItems, onMoveToCart, onRemoveItem }) => {
  if (!savedItems || savedItems.length === 0) {
    return null;
  }

  return (
    <div className="saved-items-premium-container"> {/* ✅ CHANGED */}
      <h3 className="saved-items-premium-header"> {/* ✅ CHANGED */}
        <Heart className="h-5 w-5" style={{color: '#EF4444'}} />
        <span className="saved-items-premium-title">Saved Items ({savedItems.length})</span> {/* ✅ CHANGED */}
      </h3>

      <div className="saved-items-premium-grid"> {/* ✅ CHANGED */}
        {savedItems.map((item) => (
          <SavedItem
            key={item._id}
            item={item}
            onMoveToCart={onMoveToCart}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
};

const SavedItem = ({ item, onMoveToCart, onRemoveItem }) => {
  const isOutOfStock = item.tablet?.stock === 0;

  return (
    <div className={`saved-item-premium-card ${isOutOfStock ? 'out-of-stock' : ''}`}> {/* ✅ CHANGED */}
      <div className="saved-item-premium-info"> {/* ✅ CHANGED */}
        <h4 className="saved-item-premium-name"> {/* ✅ CHANGED */}
          {item.tablet?.name || 'Unknown Medicine'}
        </h4>
        <p className="saved-item-premium-meta"> {/* ✅ CHANGED */}
          {item.tablet?.brand} • {item.tablet?.company}
        </p>
        <p className="saved-item-premium-strength"> {/* ✅ CHANGED */}
          Strength: {item.tablet?.strength}
        </p>
      </div>

      <div className="saved-item-premium-pricing"> {/* ✅ CHANGED */}
        <div className="saved-item-premium-price-box"> {/* ✅ CHANGED */}
          <p className="saved-item-premium-price"> {/* ✅ CHANGED */}
            ₹{item.tablet?.price || item.priceAtTime}
          </p>
          {!isOutOfStock && (
            <p className="saved-item-premium-stock"> {/* ✅ CHANGED */}
              {item.tablet?.stock} in stock
            </p>
          )}
        </div>
        
        {isOutOfStock && (
          <span className="saved-item-premium-badge"> {/* ✅ CHANGED */}
            Out of Stock
          </span>
        )}
      </div>

      <div className="saved-item-premium-actions"> {/* ✅ CHANGED */}
        <button
          onClick={() => onMoveToCart(item._id)}
          disabled={isOutOfStock}
          className="saved-item-premium-move-btn" // ✅ CHANGED
        >
          <ShoppingCart className="h-3 w-3" />
          <span>Move to Cart</span>
        </button>
        
        <button
          onClick={() => onRemoveItem(item._id)}
          className="saved-item-premium-remove-btn" // ✅ CHANGED
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default SavedItems;