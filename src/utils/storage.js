// src/utils/storage.js
export const setWithExpiry = (key, value, days) => {
  const now = new Date();
  const expiry = now.getTime() + days * 24 * 60 * 60 * 1000;

  const item = {
    value,
    expiry,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    return null;
  }
};
