// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { dispatch } = useCart();
  const [imageError, setImageError] = useState(false);
  
  const isOutOfStock = product.stock === 0;

  // Fungsi untuk menambah ke keranjang
  const addToCart = () => {
    if (!isOutOfStock) {
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
      isOutOfStock ? 'opacity-60' : 'hover:shadow-lg'
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
        
        {/* Overlay "Habis" jika stok kosong */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Habis</span>
          </div>
        )}
      </div>
      
      {/* Info Produk */}
      <div className="p-3">
        {/* Nama Produk */}
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Harga */}
        <p className="text-green-600 font-bold text-lg mb-2">
          Rp {product.price?.toLocaleString('id-ID') || '0'}
        </p>
        
        {/* Footer: Stok dan Tombol */}
        <div className="flex justify-between items-center">
          {/* Info Stok */}
          <span className={`text-sm ${
            isOutOfStock ? 'text-red-500' : 'text-gray-500'
          }`}>
            Stok: {product.stock || 0}
          </span>
          
          {/* Tombol Tambah */}
          <button
            onClick={addToCart}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {isOutOfStock ? 'Habis' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;