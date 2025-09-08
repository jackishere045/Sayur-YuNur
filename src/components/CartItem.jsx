// src/components/CartItem.jsx
import React, { useState } from 'react';
import { Plus, Minus, X, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { dispatch } = useCart();
  const [imageError, setImageError] = useState(false);

  // Update quantity item
  const updateQuantity = (newQuantity) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: item.id });
    } else if (newQuantity <= item.stock) {
      dispatch({ 
        type: 'UPDATE_QUANTITY', 
        payload: { id: item.id, quantity: newQuantity } 
      });
    }
  };

  const toggleSelect = () => {
    dispatch({ type: 'TOGGLE_SELECT', payload: item.id });
  };

  const removeItem = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: item.id });
  };

  const handleImageError = () => setImageError(true);

  const isMax = item.quantity >= item.stock;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={toggleSelect}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
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
            <h3 className="font-semibold text-gray-800 truncate">
              {item.name}
            </h3>
            <p className="text-green-600 font-bold">
              Rp {item.price?.toLocaleString('id-ID') || '0'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition-colors"
              >
                <Minus size={16} className="text-white" />
              </button>

              <div className="flex flex-col items-center">
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                {isMax && <span className="text-xs text-red-500">Maksimal Stok</span>}
              </div>

              <button
                onClick={() => updateQuantity(item.quantity + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${isMax ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={isMax}
              >
                <Plus size={16} className={isMax ? 'text-gray-500' : 'text-white'} />
              </button>
            </div>

            <button
              onClick={removeItem}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
              title="Hapus dari keranjang"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="mt-2 text-right">
            <span className="text-sm text-gray-500">Subtotal: </span>
            <span className="font-semibold text-gray-800">
              Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
