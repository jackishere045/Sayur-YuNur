// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Leaf } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ambil produk dari Firestore
  useEffect(() => {
  setLoading(true);
  const productsCollectionRef = collection(db, 'products');

  // Listener realtime
  const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
    const productsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts(productsData);
    setLoading(false);
  }, (error) => {
    console.error("Error fetching products from Firestore:", error);
    setLoading(false);
  });

  // cleanup listener saat unmount
  return () => unsubscribe();
}, []);


  // ambil daftar kategori unik dari Firestore
  const categories = [...new Set(products.map(p => p.category))];

  // filter produk
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || product.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // hitung statistik
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.stock > 0).length;

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white">
        <div className="px-4 pt-8 pb-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf size={32} className="text-green-200" />
              <h1 className="text-2xl font-bold">Sayur YuNur</h1>
            </div>
            <p className="text-green-100 text-sm">
              Sayur segar langsung dari petani lokal
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Cari sayur, buah, bumbu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-center">
            <div className="flex-1 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xl font-bold">{totalProducts}</div>
              <div className="text-xs text-green-100">Total Produk</div>
            </div>
            <div className="flex-1 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xl font-bold">{availableProducts}</div>
              <div className="text-xs text-green-100">Tersedia</div>
            </div>
            <div className="flex-1 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xl font-bold">Fresh</div>
              <div className="text-xs text-green-100">Hari Ini</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {searchTerm && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  {filteredProducts.length > 0 
                    ? `Ditemukan ${filteredProducts.length} produk untuk "${searchTerm}"`
                    : `Tidak ada produk yang ditemukan untuk "${searchTerm}"`
                  }
                </p>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-gray-500 text-sm">
                  Coba ubah kata kunci pencarian atau kategori
                </p>
              </div>
            )}
          </>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="text-center mt-8 text-sm text-gray-500">
            Menampilkan {filteredProducts.length} dari {totalProducts} produk
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
