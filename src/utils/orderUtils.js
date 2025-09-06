// src/utils/orderUtils.js

export const saveOrder = (order) => {
  let existingOrders = [];

  try {
    const stored = JSON.parse(localStorage.getItem("sayur-yunur-orders"));
    if (Array.isArray(stored)) {
      existingOrders = stored;
    }
  } catch (err) {
    console.warn("Error parsing orders, reset to []", err);
  }

  const updatedOrders = [...existingOrders, { ...order, createdAt: Date.now() }];
  localStorage.setItem("sayur-yunur-orders", JSON.stringify(updatedOrders));

  // Simpan data customer terakhir
  if (order.customer) {
    localStorage.setItem("sayur-yunur-customer", JSON.stringify(order.customer));
  }
};

export const getOrders = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("sayur-yunur-orders"));
    if (!Array.isArray(stored)) return [];
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    const now = Date.now();
    return stored.filter(order => now - order.createdAt < THIRTY_DAYS);
  } catch {
    return [];
  }
};

export const getLastCustomer = () => {
  try {
    return JSON.parse(localStorage.getItem("sayur-yunur-customer")) || null;
  } catch {
    return null;
  }
};
