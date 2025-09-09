// src/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CheckoutForm from '../components/CheckoutForm';
import StoreClosedBanner from '../components/StoreClosedBanner';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useStoreStatus} from '../hooks/useStoreStatus';

const CartPage = () => {
  const { cart, dispatch } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Store status hook
  const { isStoreOpen, nextOpenTime, loading: storeLoading } = useStoreStatus();

  // Ambil data produk dari Firestore untuk mendapatkan stok terkini
  useEffect(() => {
    const productsCollectionRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    }, (error) => {
      console.error("Error fetching products from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter item yang dipilih
  const selectedItems = cart.filter(item => item.selected);

  // Hitung total harga item yang dipilih
  const total = selectedItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Select/Unselect semua item
  const toggleSelectAll = () => {
    if (!isStoreOpen) return; // Prevent selection when store is closed
    
    const allSelected = cart.every(item => item.selected);
    cart.forEach(item => {
      dispatch({ type: 'TOGGLE_SELECT', payload: item.id });
    });
  };

  // Dapatkan stok produk berdasarkan ID
  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stock : 0;
  };

  // Validasi quantity dengan stok
  const validateCartQuantities = () => {
    cart.forEach(item => {
      const availableStock = getProductStock(item.id);
      if (item.quantity > availableStock) {
        // Jika quantity di cart melebihi stok, sesuaikan dengan stok yang tersedia
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: item.id, quantity: Math.max(0, availableStock) }
        });
      }
    });
  };

  // Jalankan validasi setiap kali products berubah
  useEffect(() => {
    if (products.length > 0) {
      validateCartQuantities();
    }
  }, [products]);

  // Handle checkout
  const handleCheckout = async (formData) => {
    try {
      // Cek dulu apakah toko buka
      if (!isStoreOpen) {
        alert('Maaf, toko sedang tutup. Tidak dapat melakukan pemesanan saat ini.');
        return;
      }

      // Validasi ulang stok sebelum checkout
      let hasStockIssue = false;
      const updatedItems = [];

      for (const item of selectedItems) {
        const availableStock = getProductStock(item.id);
        if (item.quantity > availableStock) {
          hasStockIssue = true;
          if (availableStock > 0) {
            // Update quantity ke stok yang tersedia
            dispatch({
              type: 'UPDATE_QUANTITY',
              payload: { id: item.id, quantity: availableStock }
            });
            updatedItems.push(`${item.name}: quantity disesuaikan menjadi ${availableStock}`);
          } else {
            // Hapus item jika stok habis
            dispatch({ type: 'REMOVE_FROM_CART', payload: item.id });
            updatedItems.push(`${item.name}: dihapus karena stok habis`);
          }
        }
      }

      if (hasStockIssue) {
        alert(`Stok beberapa produk telah berubah:\n\n${updatedItems.join('\n')}\n\nSilakan periksa kembali pesanan Anda.`);
        return;
      }

      // Buat pesan WhatsApp
      const itemsList = selectedItems.map(item => 
        `• ${item.name} x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`
      ).join('\n');

      const message = `*PESANAN SAYUR YUNUR*

*Data Pembeli:*
Nama: ${formData.name}
HP: ${formData.phone}
Alamat: ${formData.address}

*Detail Pesanan:*
${itemsList}

*Rincian Biaya:*
Subtotal: Rp ${total.toLocaleString('id-ID')}
Ongkir: Rp ${formData.shipping.toLocaleString('id-ID')}
*TOTAL: Rp ${(total + formData.shipping).toLocaleString('id-ID')}*

${formData.notes ? `📝 *Catatan:*\n${formData.notes}\n\n` : ''}Terima kasih 🙏`;

      // Encode pesan untuk URL WhatsApp
      const whatsappUrl = `https://wa.me/6287833415425?text=${encodeURIComponent(message)}`;

      // TODO: Simpan pesanan ke Firebase
      const order = {
        id: Date.now(),
        items: selectedItems,
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        },
        shipping: formData.shipping,
        subtotal: total,
        total: total + formData.shipping,
        notes: formData.notes,
        status: 'Menunggu',
        createdAt: new Date().toISOString()
      };

      console.log('Order to be saved:', order);

      // Hapus item yang sudah di-checkout dari keranjang
      dispatch({ type: 'CLEAR_SELECTED' });

      // Buka WhatsApp
      window.open(whatsappUrl, '_blank');

      // Tutup form checkout
      setShowCheckout(false);

      // Tampilkan pesan sukses
      alert('Pesanan berhasil! Anda akan diarahkan ke WhatsApp.');

    } catch (error) {
      console.error('Error during checkout:', error);
      throw error; // Re-throw untuk ditangani oleh CheckoutForm
    }
  };

  // Jika keranjang kosong
  if (cart.length === 0) {
    return (
      <div className="pb-20 min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-xl font-semibold">Keranjang Belanja</h1>
        </div>

        {/* Store Status Banner - ketika cart kosong */}
        {!storeLoading && !isStoreOpen && (
          <div className="p-4">
            <StoreClosedBanner nextOpenTime={nextOpenTime} />
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-100 rounded-full p-8 mb-6">
            <ShoppingCart size={64} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Keranjang Masih Kosong
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Belum ada produk yang ditambahkan ke keranjang. Mulai berbelanja sekarang!
          </p>
          <div className="w-32 h-1 bg-green-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  const allSelected = cart.length > 0 && cart.every(item => item.selected);

  return (
    <div className="pb-32 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Keranjang Belanja</h1>
          <span className="text-sm bg-green-700 px-2 py-1 rounded-full">
            {cart.length} item
          </span>
        </div>
      </div>

      {/* Store Status Banner - ketika ada item di cart */}
      {!storeLoading && !isStoreOpen && (
        <div className="p-4">
          <StoreClosedBanner nextOpenTime={nextOpenTime} />
        </div>
      )}

      {/* Select All */}
      <div className="bg-white border-b p-4">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-3 w-full"
          disabled={!isStoreOpen}
        >
          {allSelected ? (
            <CheckSquare 
              size={20} 
              className={isStoreOpen ? "text-green-600" : "text-gray-400"} 
            />
          ) : (
            <Square 
              size={20} 
              className={isStoreOpen ? "text-gray-400" : "text-gray-300"} 
            />
          )}
          <span className={`font-medium ${!isStoreOpen ? 'text-gray-400' : ''}`}>
            {allSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
          </span>
          <span className="text-sm text-gray-500 ml-auto">
            {selectedItems.length}/{cart.length} dipilih
          </span>
        </button>
        
        {!isStoreOpen && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
            <AlertCircle size={16} />
            <span>Pemilihan item dinonaktifkan saat toko tutup</span>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-3 pb-16">
        {cart.map(item => {
          const availableStock = getProductStock(item.id);
          return (
            <CartItem 
              key={item.id} 
              item={item} 
              availableStock={availableStock}
              disabled={!isStoreOpen} // Pass store status
            />
          );
        })}
      </div>

      {/* Checkout Bottom Sheet */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg">
          <div className="p-4">
            {/* Summary */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm text-gray-600">
                  Total ({selectedItems.length} item dipilih):
                </p>
                <p className="font-bold text-lg text-green-600">
                  Rp {total.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setShowCheckout(true)}
                disabled={!isStoreOpen}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors shadow-md ${
                  isStoreOpen 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isStoreOpen ? 'Checkout' : 'Toko Tutup'}
              </button>
            </div>

            {/* Store Status Warning */}
            {!isStoreOpen && (
              <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle size={16} />
                  <span>Checkout dinonaktifkan saat toko tutup</span>
                </div>
              </div>
            )}

            {/* Selected Items Preview */}
            <div className="text-xs text-gray-500">
              {selectedItems.slice(0, 3).map(item => item.name).join(', ')}
              {selectedItems.length > 3 && ` +${selectedItems.length - 3} lainnya`}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Form Modal - only show when store is open */}
      {showCheckout && isStoreOpen && (
        <CheckoutForm
          selectedItems={selectedItems}
          total={total}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckout}
        />
      )}
    </div>
  );
};

export default CartPage;