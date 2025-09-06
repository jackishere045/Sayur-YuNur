// src/context/CartContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart Context
const CartContext = createContext();

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.find(item => item.id === action.payload.id);
      if (existingItem) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: 1, selected: true }];
    }

    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload);

    case 'UPDATE_QUANTITY':
      return state
        .map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        )
        .filter(item => item.quantity > 0);

    case 'TOGGLE_SELECT':
      return state.map(item =>
        item.id === action.payload
          ? { ...item, selected: !item.selected }
          : item
      );

    case 'CHECKOUT': {
    const newOrder = {
      id: Date.now(),
      items: state,
      createdAt: new Date().toISOString(),
      subtotal: state.reduce((sum, item) => sum + item.price * item.quantity, 0),
      shipping: 5000, // bisa diset sesuai aturan ongkir
      total: state.reduce((sum, item) => sum + item.price * item.quantity, 0) + 5000,
      customer: action.payload.customer, // nama, telp, alamat dari form checkout
      notes: action.payload.notes || ''
    };

    // simpan ke localStorage orders
    const existingOrders = JSON.parse(localStorage.getItem('sayur-yunur-orders') || '[]');
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem('sayur-yunur-orders', JSON.stringify(updatedOrders));

    // setelah checkout, kosongkan keranjang
    return [];
  }


    case 'CLEAR_SELECTED':
      return state.filter(item => !item.selected);

    default:
      return state;
  }
};

// ✅ Lazy initializer: baca cart dari localStorage saat reducer pertama kali dipanggil
const init = () => {
  try {
    const savedCart = localStorage.getItem('sayur-yunur-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
};

// Provider
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, [], init);

  // Simpan ke localStorage setiap ada perubahan
  useEffect(() => {
    localStorage.setItem('sayur-yunur-cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
