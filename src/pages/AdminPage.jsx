// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, storage, auth } from '../firebase';
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Search,
  AlertCircle,
  CheckCircle,
  Menu,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  X,
  Minus,
  PlusIcon
} from 'lucide-react';

const AdminPage = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '' // Changed to string to store URL
  });
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [categoriesFromDB, setCategoriesFromDB] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [updatingStock, setUpdatingStock] = useState({});

  // Predefined categories
  const defaultCategories = ['Sayur', 'Buah', 'Bumbu', 'Lauk', 'Sembako'];

  // Fetch categories from existing products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const cats = new Set(defaultCategories);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.category && data.category.trim()) {
            cats.add(data.category.trim());
          }
        });
        setCategoriesFromDB([...cats].sort());
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsCollectionRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsCollectionRef);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      console.log('Products fetched:', productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      showNotification('Gagal memuat produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick stock update function
  const updateStock = async (productId, change) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, (product.stock || 0) + change);
    
    setUpdatingStock(prev => ({ ...prev, [productId]: true }));

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date()
      });

      // Update local state immediately for better UX
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      ));

      showNotification(
        `Stok ${product.name} ${change > 0 ? 'ditambah' : 'dikurangi'} ${Math.abs(change)}`,
        'success'
      );
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification('Gagal memperbarui stok', 'error');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Gagal logout', 'error');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category || '',
        imageUrl: product.imageUrl || '' // Set existing imageUrl
      });
      setImagePreview(product.imageUrl || null); // Set preview if imageUrl exists
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: '',
        imageUrl: '' // Clear imageUrl for new product
      });
      setImagePreview(null);
    }
    setShowModal(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      stock: '',
      category: '',
      imageUrl: ''
    });
    setImagePreview(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Nama produk harus diisi', 'error');
      return false;
    }
    if (!formData.category.trim()) {
      showNotification('Kategori harus diisi', 'error');
      return false;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      showNotification('Harga harus berupa angka lebih dari 0', 'error');
      return false;
    }
    if (!formData.stock || isNaN(formData.stock) || Number(formData.stock) < 0) {
      showNotification('Stok harus berupa angka tidak negatif', 'error');
      return false;
    }
    // Allow empty imageUrl for products without an image or if user doesn't want to change it
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category.trim(),
        imageUrl: formData.imageUrl, // Use the URL from formData
        updatedAt: new Date()
      };

      if (editingProduct) {
        // Update existing product
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        showNotification('Produk berhasil diperbarui');
        console.log('Product updated:', editingProduct.id);
      } else {
        // Add new product
        productData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'products'), productData);
        showNotification('Produk berhasil ditambahkan');
        console.log('New product added:', docRef.id);
      }

      closeModal();
      await fetchProducts(); // Refresh the products list

    } catch (error) {
      console.error('Error saving product:', error);
      showNotification(error.message || 'Gagal menyimpan produk', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus "${product.name}"?\n\nTindakan ini tidak dapat dibatalkan.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteDoc(doc(db, 'products', product.id));
        console.log('Product deleted from Firestore:', product.id);
        showNotification('Produk berhasil dihapus');
        await fetchProducts(); // Refresh the products list
      } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Gagal menghapus produk', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Stock Control Component
  const StockControl = ({ product, size = 'normal' }) => {
    const isUpdating = updatingStock[product.id];
    const isSmall = size === 'small';
    
    return (
      <div className={`flex items-center gap-1 ${isSmall ? 'text-xs' : 'text-sm'}`}>
        <button
          onClick={() => updateStock(product.id, -1)}
          disabled={isUpdating || product.stock <= 0}
          className={`${isSmall ? 'p-1' : 'p-1.5'} text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Kurangi stok"
        >
          <Minus className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'}`} />
        </button>
        
        <span className={`${isSmall ? 'min-w-[2rem] px-1' : 'min-w-[2.5rem] px-2'} py-1 text-center font-medium rounded bg-gray-100 ${
          isUpdating ? 'animate-pulse' : ''
        }`}>
          {product.stock || 0}
        </span>
        
        <button
          onClick={() => updateStock(product.id, 1)}
          disabled={isUpdating}
          className={`${isSmall ? 'p-1' : 'p-1.5'} text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Tambah stok"
        >
          <PlusIcon className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 md:right-4 md:left-auto z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-sm md:text-base text-gray-600">Kelola produk Sayur YuNur</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Selamat datang, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 px-2">
                  {user?.email}
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Produk</p>
                <p className="text-lg md:text-xl font-semibold">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Tersedia</p>
                <p className="text-lg md:text-xl font-semibold">
                  {products.filter(p => p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Stok Habis</p>
                <p className="text-lg md:text-xl font-semibold">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Tag className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Kategori</p>
                <p className="text-lg md:text-xl font-semibold">
                  {[...new Set(products.map(p => p.category).filter(Boolean))].length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tambah Produk Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {filteredProducts.map(product => (
                  <div key={product.id} className="border-b border-gray-200 p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.category || 'Tidak ada kategori'}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => openModal(product)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit Produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 mb-2">{formatPrice(product.price || 0)}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Stok:</span>
                              <StockControl product={product} size="small" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Produk
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Harga
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Kontrol Stok
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {product.category || 'Tidak ada kategori'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatPrice(product.price || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StockControl product={product} />
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              (product.stock || 0) > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(product.stock || 0) > 0 ? 'Tersedia' : 'Habis'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(product)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Edit produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Hapus produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="Contoh: Kol Segar"
                  required
                  disabled={uploading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <div className="space-y-2">
                  {/* Input teks untuk kategori baru */}
                  <input
                    type="text"
                    placeholder="Ketik atau pilih kategori"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="category-suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    required
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    placeholder="10"
                    required
                    min="0"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Gambar Produk
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreview(e.target.value); // Update preview directly from URL
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="https://example.com/image.jpg"
                  disabled={uploading}
                />
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">Pratinjau Gambar:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop if URL is invalid
                        e.target.style.display = 'none'; // Hide broken image icon
                        console.error("Failed to load image preview from URL.");
                        // Optionally, you could display a placeholder image or text here
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Tambah Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;