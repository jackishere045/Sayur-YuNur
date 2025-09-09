// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, disabled = false }) => {
  const { dispatch } = useCart();
  const [imageError, setImageError] = useState(false);
  
  const isOutOfStock = product.stock === 0;
  const isDisabled = disabled || isOutOfStock; // Disable jika toko tutup atau stok habis

  // Fungsi untuk menambah ke keranjang
  const addToCart = () => {
    if (!isDisabled) {
      dispatch({ type: 'ADD_ITEM', payload: product });
      
      // Feedback visual (opsional)
      // Bisa ditambahkan toast notification di sini
      console.log(`${product.name} ditambahkan ke keranjang`);
    }
  };

  // Handle error gambar
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${
      isDisabled ? 'opacity-60' : 'hover:shadow-lg'
    }`}>
      {/* Gambar Produk */}
      <div className="relative aspect-square">
        {!imageError ? (
          <img 
            src={product.imageUrl || '/api/placeholder/200/200'} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          // Placeholder jika gambar error
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Habis
            </span>
          ) : disabled ? (
            <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Clock size={10} />
              <span>Tutup</span>
            </div>
          ) : null}
        </div>
        
        {/* Overlay jika disabled */}
        {isDisabled && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            {disabled && !isOutOfStock ? (
              <div className="text-white font-semibold text-center">
                <Clock size={24} className="mx-auto mb-1" />
                <span className="text-sm">Toko Tutup</span>
              </div>
            ) : (
              <span className="text-white font-semibold text-lg">Habis</span>
            )}
          </div>
        )}
      </div>
      
      {/* Info Produk */}
      <div className="p-3">
        {/* Nama Produk */}
        <h3 className={`font-semibold mb-1 line-clamp-2 ${
          isDisabled ? 'text-gray-500' : 'text-gray-800'
        }`}>
          {product.name}
        </h3>
        
        {/* Harga */}
        <p className={`font-bold text-lg mb-2 ${
          isDisabled ? 'text-gray-400' : 'text-green-600'
        }`}>
          Rp {product.price?.toLocaleString('id-ID') || '0'}
        </p>
        
        {/* Footer: Stok dan Tombol */}
        <div className="flex justify-between items-center">
          {/* Info Stok */}
          <span className={`text-sm ${
            isOutOfStock ? 'text-red-500' : 
            disabled ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Stok: {product.stock || 0}
          </span>
          
          {/* Tombol Tambah */}
          <button
            onClick={addToCart}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {disabled && !isOutOfStock ? (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Tutup</span>
              </div>
            ) : isOutOfStock ? 'Habis' : 'Tambah'}
          </button>
        </div>
        
        {/* Pesan tambahan jika toko tutup */}
        {disabled && !isOutOfStock && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tidak dapat dipesan saat toko tutup
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;