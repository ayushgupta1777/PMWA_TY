// src/pages/Worker/Dashboard.js (Premium Styled Version)
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, History, User, LogOut, Package, Bell, Search, Heart,Plus } from 'lucide-react';
import MedicineSearch from '../components/MedicineSearch';
import CartPage from '../components/Cart/CartPage';
import BillHistory from '../components/Billing/BillHistory';
import SavedItems from '../pages/Worker/SavedItems'; 
import CartIcon from '../components/Cart/CartIcon';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { cartUtils } from '../utils/cartUtils';
import StockRequestPanel from '../components/StockRequest/StockRequestPanel';
import MyRequests from '../components/StockRequest/MyRequests';
import { useStockRequests } from '../hooks/useStockRequests';
import '../Styling/pages/WorkerDashboardPremium.css';

const WorkerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartSummary, cart } = useCart();
  const [activeView, setActiveView] = useState('search');
  const [cartWarnings, setCartWarnings] = useState([]);
  const navigate = useNavigate();

  const [showStockRequest, setShowStockRequest] = useState(false);
  const { requests } = useStockRequests('worker');
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);

  const cartSummary = getCartSummary();
  const savedItemsCount = cart?.savedItems?.length || 0;

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/tablets/popular?limit=100`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const medicines = data.medicines || data || [];
          setAllMedicines(medicines);
          
          const lowStock = medicines.filter(med => {
            const minStock = med.minStockLevel || 10;
            return med.stock < minStock && med.isActive !== false;
          });
          
          console.log('Low stock items found:', lowStock.length);
          setLowStockMedicines(lowStock);
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      }
    };

    fetchMedicines();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setActiveView('search');
        const searchInput = document.querySelector('input[type="text"][placeholder*="search" i]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/worker/login');
    }
  };

  const handleCartClick = () => {
    setActiveView('cart');
  };

  const handleSavedItemsClick = () => {
    navigate('/worker/saved-items');
  };

  const navigationItems = [
    {
      id: 'search',
      label: 'Search Medicines',
      icon: Search,
      count: null
    },
    {
      id: 'cart',
      label: 'Shopping Cart',
      icon: ShoppingCart,
      count: cartSummary.totalItems
    },
    {
      id: 'saved',
      label: 'Saved Items',
      icon: Heart,
      count: savedItemsCount,
      action: handleSavedItemsClick
    },
    {
      id: 'history',
      label: 'Bill History',
      icon: History,
      count: null
    }, 
    {
      id: 'stock-requests',
      label: 'Stock Requests',
      icon: Package,
      count: requests.filter(r => r.status === 'Pending').length
    }
  ];

  return (
    <div className="worker-premium-dashboard">
      {/* Header */}
      <header className="worker-premium-header">
        <div className="worker-premium-header-container">
          <div className="worker-premium-header-content">
            {/* Logo and Title */}
            <div className="worker-premium-logo-section">
              <div className="worker-premium-logo-icon">
                <Package className="worker-premium-icon" />
              </div>
              <div className="worker-premium-title-group">
                <h1 className="worker-premium-title">
                  PharmaCare Worker
                </h1>
                <p className="worker-premium-subtitle">
                  Medicine Management System
                </p>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="worker-premium-header-actions">
              {/* Cart Icon */}
              <div className="worker-premium-action-item">
                <CartIcon onClick={handleCartClick} />
              </div>

              {/* Saved Items Icon */}
              {savedItemsCount > 0 && (
                <button
                  onClick={handleSavedItemsClick}
                  className="worker-premium-saved-btn"
                  title="Saved Items"
                >
                  <Heart className="worker-premium-icon" />
                  <span className="worker-premium-badge worker-premium-badge-saved">
                    {savedItemsCount > 99 ? '99+' : savedItemsCount}
                  </span>
                </button>
              )}
              
              {/* Notifications */}
              {cartWarnings.length > 0 && (
                <button className="worker-premium-notification-btn">
                  <Bell className="worker-premium-icon" />
                  <span className="worker-premium-badge worker-premium-badge-warning">
                    {cartWarnings.length}
                  </span>
                </button>
              )}

              {/* User Menu */}
              <div className="worker-premium-user-section">
                <div className="worker-premium-user-info">
                  <User className="worker-premium-user-icon" />
                  <div className="worker-premium-user-details">
                    <p className="worker-premium-user-name">{user?.name}</p>
                    <p className="worker-premium-user-id">{user?.employeeId}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="worker-premium-logout-btn"
                >
                  <LogOut className="worker-premium-icon-sm" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Low Stock Alert Banner */}
      {lowStockMedicines.length > 0 && activeView === 'search' && (
        <div className="worker-premium-alert-banner worker-premium-alert-warning">
          <div className="worker-premium-alert-container">
            <div className="worker-premium-alert-content">
              <div className="worker-premium-alert-info">
                <Bell className="worker-premium-alert-icon" />
                <div className="worker-premium-alert-text">
                  <p className="worker-premium-alert-title">
                    {lowStockMedicines.length} item{lowStockMedicines.length !== 1 ? 's' : ''} low on stock
                  </p>
                  <p className="worker-premium-alert-subtitle">
                    Request stock replenishment to avoid shortages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStockRequest(true)}
                className="worker-premium-alert-btn"
              >
                <Package className="worker-premium-icon-sm" />
                Request Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="worker-premium-nav">
        <div className="worker-premium-nav-container">
          <div className="worker-premium-nav-tabs">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`worker-premium-nav-tab ${isActive ? 'worker-premium-nav-tab-active' : ''}`}
                >
                  <Icon className="worker-premium-nav-icon" />
                  <span className="worker-premium-nav-label">{item.label}</span>
                  {item.count > 0 && (
                    <span className={`worker-premium-nav-count ${isActive ? 'worker-premium-nav-count-active' : ''}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Cart Summary Bar */}
      {cartSummary.totalItems > 0 && activeView !== 'cart' && (
        <div className="worker-premium-cart-summary">
          <div className="worker-premium-cart-summary-container">
            <div className="worker-premium-cart-summary-content">
              <div className="worker-premium-cart-summary-info">
                <ShoppingCart className="worker-premium-cart-icon" />
                <span className="worker-premium-cart-text">
                  {cartUtils.generateCartSummaryText({ items: cart?.items || [] })}
                </span>
                <span className="worker-premium-cart-total">
                  Total: {cartUtils.formatCurrency(cartSummary.totalAmount)}
                </span>
              </div>
              <button
                onClick={() => setActiveView('cart')}
                className="worker-premium-cart-view-btn"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warnings/Alerts */}
      {cartWarnings.length > 0 && (
        <div className="worker-premium-warnings-bar">
          <div className="worker-premium-warnings-container">
            <div className="worker-premium-warnings-list">
              {cartWarnings.slice(0, 2).map((warning, index) => (
                <div key={index} className="worker-premium-warning-item">
                  <Bell className="worker-premium-warning-icon" />
                  <span>{warning.message}</span>
                </div>
              ))}
              {cartWarnings.length > 2 && (
                <button
                  onClick={() => setActiveView('cart')}
                  className="worker-premium-warning-link"
                >
                  View all {cartWarnings.length} warnings in cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="worker-premium-main">
        {/* Search View */}
        {activeView === 'search' && (
          <div className="worker-premium-view">
            {/* Welcome Section */}
            <div className="worker-premium-welcome">
              <h2 className="worker-premium-welcome-title">
                Search Medicines
              </h2>
              <p className="worker-premium-welcome-text">
                Find medicines quickly with our intelligent search system
              </p>
              <div className="worker-premium-welcome-features">
                <span className="worker-premium-feature">• Fuzzy search for typos</span>
                <span className="worker-premium-feature">• Real-time suggestions</span>
                <span className="worker-premium-feature">• Voice search enabled</span>
              </div>
            </div>
            
            {/* Search Component */}
            <div className="worker-premium-search-wrapper">
              <MedicineSearch />
            </div>

            {/* Quick Stats */}
            <div className="worker-premium-stats-grid">
              <div className="worker-premium-stat-card worker-premium-stat-card-blue">
                <div className="worker-premium-stat-value">
                  {cartSummary.totalItems}
                </div>
                <div className="worker-premium-stat-label">Items in Cart</div>
              </div>
              
              <div className="worker-premium-stat-card worker-premium-stat-card-green">
                <div className="worker-premium-stat-value">
                  {cartUtils.formatCurrency(cartSummary.totalAmount).replace('₹', '')}
                </div>
                <div className="worker-premium-stat-label">Cart Value</div>
              </div>
              
              <div className="worker-premium-stat-card worker-premium-stat-card-purple">
                <div className="worker-premium-stat-value">
                  {cartSummary.uniqueItems}
                </div>
                <div className="worker-premium-stat-label">Unique Medicines</div>
              </div>

              <div 
                className="worker-premium-stat-card worker-premium-stat-card-red worker-premium-stat-card-clickable" 
                onClick={handleSavedItemsClick}
              >
                <div className="worker-premium-stat-value">
                  {savedItemsCount}
                </div>
                <div className="worker-premium-stat-label">Saved Items</div>
              </div>
            </div>
          </div>
        )}

        {/* Cart View */}
        {activeView === 'cart' && <CartPage />}

        {/* Stock Requests View */}
        {activeView === 'stock-requests' && <MyRequests />}

        {/* Saved Items View */}
        {activeView === 'saved' && <SavedItems />}

        {/* History View */}
        {activeView === 'history' && (
          <div className="worker-premium-view">
            <div className="worker-premium-history-header">
              <h2 className="worker-premium-section-title">Bill History</h2>
              <p className="worker-premium-section-subtitle">View and manage your previous bills</p>
            </div>
            <BillHistory />
          </div>
        )}
      </main>

      {/* Floating Stock Request Button */}
      <button
        onClick={() => navigate('/worker/stock-requests')}
        className="worker-premium-fab worker-premium-fab-stock"
        title="Request Stock"
      >
        <Package className="worker-premium-fab-icon" />
      </button>




      <button
        onClick={() => navigate('/owner/medicines')}
        className="worker-premium-fab worker-premium-fab-add-stock"
        title="Add New Stock"
        style={{ bottom: '30px' }}
      >
        <Plus className="worker-premium-fab-icon" />
      </button>



      {/* Floating Action Button for Cart (Mobile) */}
      {cartSummary.totalItems > 0 && activeView !== 'cart' && (
        <div className="worker-premium-fab-mobile">
          <button
            onClick={() => setActiveView('cart')}
            className="worker-premium-fab worker-premium-fab-cart"
          >
            <ShoppingCart className="worker-premium-fab-icon" />
            <span className="worker-premium-fab-badge">
              {cartSummary.totalItems}
            </span>
          </button>
        </div>
      )}

      {/* Quick Search Shortcut (Ctrl+K) */}
      <div className="worker-premium-shortcut-hint">
        Press <kbd className="worker-premium-kbd">Ctrl+K</kbd> to focus search
      </div>
    </div>
  );
};

export default WorkerDashboard;