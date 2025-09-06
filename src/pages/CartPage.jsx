// src/pages/CartPage.jsx
import React, { useState } from 'react';
import { ShoppingCart, CheckSquare, Square } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CheckoutForm from '../components/CheckoutForm';

const CartPage = () => {
  const { cart, dispatch } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  // Filter item yang dipilih
  const selectedItems = cart.filter(item => item.selected);
  
  // Hitung total harga item yang dipilih
  const total = selectedItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Select/Unselect semua item
  const toggleSelectAll = () => {
    const allSelected = cart.every(item => item.selected);
    cart.forEach(item => {
      dispatch({ 
        type: 'TOGGLE_SELECT', 
        payload: item.id 
      });
    });
  };

  // Handle checkout
  const handleCheckout = async (formData) => {
    try {
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
        
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-100 rounded-full p-8 mb-6">
            <ShoppingCart size={64} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Keranjang Masih Kosong
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Belum ada produk yang ditambahkan ke keranjang. 
            Mulai berbelanja sekarang!
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
      
      {/* Select All */}
      <div className="bg-white border-b p-4">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-3 w-full"
        >
          {allSelected ? (
            <CheckSquare size={20} className="text-green-600" />
          ) : (
            <Square size={20} className="text-gray-400" />
          )}
          <span className="font-medium">
            {allSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
          </span>
          <span className="text-sm text-gray-500 ml-auto">
            {selectedItems.length}/{cart.length} dipilih
          </span>
        </button>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-3">
        {cart.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
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
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                Checkout
              </button>
            </div>
            
            {/* Selected Items Preview */}
            <div className="text-xs text-gray-500">
              {selectedItems.slice(0, 3).map(item => item.name).join(', ')}
              {selectedItems.length > 3 && ` +${selectedItems.length - 3} lainnya`}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {showCheckout && (
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