import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, RefreshCw, AlertCircle, Heart } from 'lucide-react';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import SavedItems from './SavedItems';
import BillingModal from '../Billing/BillingModal';
import { cartService } from '../../services/cartService';
import '../../Styling/components/Cart/CartPagePremium.css'; // ✅ ADD THIS

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.cart);
      setSavedItems(response.cart?.savedItems || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartService.updateQuantity(itemId, quantity);
      setCart(response.cart);
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const response = await cartService.removeItem(itemId);
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setError('Failed to remove item. Please try again.');
    }
  };

  const handleSaveForLater = async (itemId) => {
    try {
      const response = await cartService.saveForLater(itemId);
      setCart(response.cart);
      setSavedItems(response.cart.savedItems || []);
    } catch (error) {
      console.error('Failed to save item:', error);
      setError('Failed to save item for later.');
    }
  };

  const handleMoveToCart = async (savedItemId) => {
    try {
      const response = await cartService.moveToCart(savedItemId);
      setCart(response.cart);
      setSavedItems(response.cart.savedItems || []);
    } catch (error) {
      console.error('Failed to move item to cart:', error);
      setError('Failed to move item to cart.');
    }
  };

  const handleSyncCart = async () => {
    try {
      setSyncing(true);
      const response = await cartService.syncCart();
      setCart(response.cart);
      
      if (response.changes?.hasChanges) {
        setError(response.message || 'Cart has been updated based on current availability.');
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
      setError('Failed to sync cart.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        await cartService.clearCart();
        setCart({ items: [], totalItems: 0, totalAmount: 0 });
      } catch (error) {
        console.error('Failed to clear cart:', error);
        setError('Failed to clear cart.');
      }
    }
  };

  const handleCheckout = () => {
    setShowBillingModal(true);
  };

  const handleBillGenerated = () => {
    setShowBillingModal(false);
    setCart({ items: [], totalItems: 0, totalAmount: 0 });
  };

  if (loading) {
    return (
      <div className="cart-page-premium-loading"> {/* ✅ CHANGED */}
        <div className="cart-page-premium-spinner"></div> {/* ✅ CHANGED */}
      </div>
    );
  }

  const hasItems = cart?.items?.length > 0;
  const hasSavedItems = savedItems?.length > 0;
  const savedItemsCount = cart?.savedItems?.length || 0;

  return (
    <div className="cart-page-premium-wrapper"> {/* ✅ CHANGED */}
      {/* Header */}
      <div className="cart-page-premium-header"> {/* ✅ CHANGED */}
        <div className="cart-page-premium-header-content"> {/* ✅ CHANGED */}
          <div className="cart-page-premium-header-main"> {/* ✅ CHANGED */}
            <div className="cart-page-premium-nav-section"> {/* ✅ CHANGED */}
              <button
                onClick={() => navigate(-1)}
                className="cart-page-premium-back-btn" // ✅ CHANGED
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              
              <div className="cart-page-premium-title-section"> {/* ✅ CHANGED */}
                <ShoppingCart className="h-6 w-6" style={{color: '#0066FF'}} />
                <h1 className="cart-page-premium-title"> {/* ✅ CHANGED */}
                  Shopping Cart
                  {hasItems && (
                    <span className="cart-page-premium-item-count"> {/* ✅ CHANGED */}
                      ({cart.totalItems} items)
                    </span>
                  )}
                </h1>
              </div>
            </div>

            {savedItemsCount > 0 && (
              <button
                onClick={() => navigate('/worker/saved-items')}
                className="cart-page-premium-saved-btn" // ✅ CHANGED
              >
                <Heart className="h-4 w-4" />
                <span>Saved Items ({savedItemsCount})</span>
              </button>
            )}

            {hasItems && (
              <div className="cart-page-premium-actions"> {/* ✅ CHANGED */}
                <button
                  onClick={handleSyncCart}
                  disabled={syncing}
                  className="cart-page-premium-sync-btn" // ✅ CHANGED
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'cart-item-premium-spinner' : ''}`} />
                  <span>Sync Cart</span>
                </button>
                
                <button
                  onClick={handleClearCart}
                  className="cart-page-premium-clear-btn" // ✅ CHANGED
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="cart-page-premium-error"> {/* ✅ CHANGED */}
          <div className="cart-page-premium-error-box"> {/* ✅ CHANGED */}
            <AlertCircle className="h-5 w-5" style={{color: '#D97706'}} />
            <span className="cart-page-premium-error-text">{error}</span> {/* ✅ CHANGED */}
            <button
              onClick={() => setError('')}
              className="cart-page-premium-error-close" // ✅ CHANGED
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="cart-page-premium-content"> {/* ✅ CHANGED */}
        {hasItems ? (
          <div className="cart-page-premium-grid"> {/* ✅ CHANGED */}
            {/* Cart Items */}
            <div className="cart-page-premium-items-section"> {/* ✅ CHANGED */}
              <h2 className="cart-page-premium-section-title"> {/* ✅ CHANGED */}
                Cart Items ({cart.items.length})
              </h2>
              
              {cart.items.map((item) => (
                <CartItem
                  key={item._id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onSaveForLater={handleSaveForLater}
                />
              ))}
            </div>

            {/* Cart Summary */}
            <div>
              <CartSummary
                cart={cart}
                onCheckout={handleCheckout}
                isCheckingOut={isCheckingOut}
              />
            </div>
          </div>
        ) : (
          /* Empty Cart */
          <div className="cart-page-premium-empty"> {/* ✅ CHANGED */}
            <ShoppingCart className="cart-page-premium-empty-icon" /> {/* ✅ CHANGED */}
            <h2 className="cart-page-premium-empty-title">Your cart is empty</h2> {/* ✅ CHANGED */}
            <p className="cart-page-premium-empty-text"> {/* ✅ CHANGED */}
              Start adding medicines to your cart to see them here.
            </p>
            <button
              onClick={() => navigate('/worker/dashboard')}
              className="cart-page-premium-continue-btn" // ✅ CHANGED
            >
              Continue Shopping
            </button>

            {savedItemsCount > 0 && (
              <button
                onClick={() => navigate('/worker/saved-items')}
                className="cart-page-premium-view-saved-btn" // ✅ CHANGED
              >
                <Heart className="h-4 w-4" />
                <span>View Saved Items ({savedItemsCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Billing Modal */}
      {showBillingModal && (
        <BillingModal
          cart={cart}
          onClose={() => setShowBillingModal(false)}
          onBillGenerated={handleBillGenerated}
        />
      )}
    </div>
  );
};

export default CartPage;