import { useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';

export const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.cart);
      setError('');
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback(async (tabletId, quantity = 1) => {
    try {
      const response = await cartService.addToCart(tabletId, quantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const response = await cartService.updateQuantity(itemId, quantity);
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Remove item from cart
  const removeItem = useCallback(async (itemId) => {
    try {
      const response = await cartService.removeItem(itemId);
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      const response = await cartService.clearCart();
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Sync cart
  const syncCart = useCallback(async () => {
    try {
      const response = await cartService.syncCart();
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Save for later
  const saveForLater = useCallback(async (itemId) => {
    try {
      const response = await cartService.saveForLater(itemId);
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Move to cart
  const moveToCart = useCallback(async (savedItemId) => {
    try {
      const response = await cartService.moveToCart(savedItemId);
      setCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Get cart summary
  const getCartSummary = useCallback(() => {
    if (!cart) return { totalItems: 0, totalAmount: 0, uniqueItems: 0 };
    
    return {
      totalItems: cart.totalItems || 0,
      totalAmount: cart.totalAmount || 0,
      uniqueItems: cart.items?.length || 0,
      isEmpty: !cart.items?.length
    };
  }, [cart]);

  // Check if item is in cart
  const isInCart = useCallback((tabletId) => {
    return cart?.items?.some(item => item.tablet?._id === tabletId) || false;
  }, [cart]);

  // Get cart item quantity
  const getItemQuantity = useCallback((tabletId) => {
    const item = cart?.items?.find(item => item.tablet?._id === tabletId);
    return item?.quantity || 0;
  }, [cart]);

  // Initialize cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    syncCart,
    saveForLater,
    moveToCart,
    fetchCart,
    getCartSummary,
    isInCart,
    getItemQuantity
  };
};
