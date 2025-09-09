// src/components/CartItem.jsx
import React, { useState } from 'react';
import { Plus, Minus, X, Trash2, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item, availableStock, disabled = false }) => {
  const { dispatch } = useCart();
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = availableStock <= 0;
  const isOverStock = item.quantity > availableStock;
  const isMax = item.quantity >= availableStock;

  // Update quantity item
  const updateQuantity = (newQuantity) => {
    if (disabled) return;
    
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: item.id });
    } else {
      dispatch({ 
        type: 'UPDATE_QUANTITY', 
        payload: { id: item.id, quantity: Math.min(newQuantity, availableStock) } 
      });
    }
  };

  const toggleSelect = () => {
    if (disabled) return;
    dispatch({ type: 'TOGGLE_SELECT', payload: item.id });
  };

  const removeItem = () => {
    if (disabled) return;
    dispatch({ type: 'REMOVE_ITEM', payload: item.id });
  };

  const handleImageError = () => setImageError(true);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 ${
      disabled ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={toggleSelect}
            disabled={disabled}
            className={`w-4 h-4 border-gray-300 rounded focus:ring-green-500 ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-green-600'
            }`}
          />
        </div>

        <div className="flex-shrink-0">
          {!imageError ? (
            <img 
              src={item.imageUrl || '/api/placeholder/80/80'} 
              alt={item.name}
              className="w-16 h-16 object-cover rounded-md"
              onError={handleImageError}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Img</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className={`font-semibold truncate ${
              disabled ? 'text-gray-500' : 'text-gray-800'
            }`}>
              {item.name}
            </h3>
            <p className={`font-bold ${
              disabled ? 'text-gray-400' : 'text-green-600'
            }`}>
              Rp {item.price?.toLocaleString('id-ID') || '0'}
            </p>
          </div>

          {/* Stock Status & Warnings */}
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            <span className={disabled ? 'text-gray-400' : 'text-gray-500'}>
              Stok tersedia: {availableStock}
            </span>
            
            {isOutOfStock && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle size={12} />
                <span>Habis</span>
              </div>
            )}
            
            {isOverStock && !isOutOfStock && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle size={12} />
                <span>Melebihi stok</span>
              </div>
            )}
            
            {disabled && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={12} />
                <span>Toko tutup</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.quantity - 1)}
                disabled={disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  disabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-700 text-white'
                }`}
              >
                <Minus size={16} />
              </button>

              <div className="flex flex-col items-center">
                <span className={`w-8 text-center font-medium ${
                  isOverStock ? 'text-red-600' : disabled ? 'text-gray-500' : 'text-gray-800'
                }`}>
                  {item.quantity}
                </span>
                {isMax && !disabled && (
                  <span className="text-xs text-red-500">Maksimal Stock</span>
                )}
              </div>

              <button
                onClick={() => updateQuantity(item.quantity + 1)}
                disabled={disabled || isMax}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  disabled || isMax 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={removeItem}
              disabled={disabled}
              className={`p-2 rounded-full transition-colors ${
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
              }`}
              title="Hapus dari keranjang"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="mt-2 text-right">
            <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
              Subtotal: 
            </span>
            <span className={`font-semibold ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>
              Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Warning Messages */}
          {disabled && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Item tidak dapat diubah saat toko tutup</span>
              </div>
            </div>
          )}
          
          {!disabled && isOverStock && (
            <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
              <div className="flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Quantity akan disesuaikan dengan stok saat checkout</span>
              </div>
            </div>
          )}
          
          {!disabled && isOutOfStock && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
              <div className="flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Item akan dihapus saat checkout karena stok habis</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;