// src/context/CartContext.js - FIXED FOR NEW PRICING STRUCTURE
import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    savedItems: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await cartService.getCart();
      setCart(response.cart || { items: [], totalItems: 0, totalAmount: 0, savedItems: [] });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setError('Failed to load cart');
      setCart({ items: [], totalItems: 0, totalAmount: 0, savedItems: [] });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (medicine, quantity = 1) => {
    try {
      setError('');
      const response = await cartService.addToCart(medicine._id, quantity);
      setCart(response.cart);
      return { success: true, message: `Added ${quantity} tablet${quantity > 1 ? 's' : ''} to cart` };
    } catch (error) {
      console.error('Failed to add to cart:', error);
      const errorMessage = error.message || 'Failed to add item to cart';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setError('');
      const response = await cartService.updateQuantity(itemId, quantity);
      setCart(response.cart);
      return { success: true };
    } catch (error) {
      console.error('Failed to update quantity:', error);
      const errorMessage = error.message || 'Failed to update quantity';
      setError(errorMessage);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setError('');
      const response = await cartService.removeItem(itemId);
      setCart(response.cart);
      return { success: true, message: 'Item removed from cart' };
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      const errorMessage = error.message || 'Failed to remove item from cart';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const clearCart = async () => {
    try {
      setError('');
      await cartService.clearCart();
      setCart({ items: [], totalItems: 0, totalAmount: 0, savedItems: [] });
      return { success: true, message: 'Cart cleared successfully' };
    } catch (error) {
      console.error('Failed to clear cart:', error);
      const errorMessage = error.message || 'Failed to clear cart';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const syncCart = async () => {
    try {
      setError('');
      const response = await cartService.syncCart();
      setCart(response.cart);
      return response;
    } catch (error) {
      console.error('Failed to sync cart:', error);
      const errorMessage = error.message || 'Failed to sync cart';
      setError(errorMessage);
      throw error;
    }
  };

  const saveForLater = async (itemId) => {
    try {
      setError('');
      const response = await cartService.saveForLater(itemId);
      setCart(response.cart);
      return { success: true, message: 'Item saved for later' };
    } catch (error) {
      console.error('Failed to save for later:', error);
      const errorMessage = error.message || 'Failed to save item';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const moveToCart = async (savedItemId) => {
    try {
      setError('');
      const response = await cartService.moveToCart(savedItemId);
      setCart(response.cart);
      return { success: true, message: 'Item moved back to cart' };
    } catch (error) {
      console.error('Failed to move to cart:', error);
      const errorMessage = error.message || 'Failed to move item';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const getTotalItems = () => {
    return cart?.totalItems || 0;
  };

  const getTotalAmount = () => {
    return cart?.totalAmount || 0;
  };

  const getCartItem = (medicineId) => {
    return cart?.items?.find(item => item.tablet?._id === medicineId);
  };

  const isInCart = (medicineId) => {
    return cart?.items?.some(item => item.tablet?._id === medicineId) || false;
  };

  const getItemQuantity = (medicineId) => {
    const item = getCartItem(medicineId);
    return item?.quantity || 0;
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    fetchCart,
    saveForLater,
    moveToCart,
    getTotalItems,
    getTotalAmount,
    getCartItem,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };