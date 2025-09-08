// src/pages/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { Package, Calendar, Phone, MapPin, Trash2, MessageCircle } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal'; // import FeedbackModal

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false); // state modal feedback

  // Load orders dari localStorage
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // simulasi delay

      try {
        const savedOrders = JSON.parse(localStorage.getItem('sayur-yunur-orders') || '[]');
        const sortedOrders = [...savedOrders].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      }

      setLoading(false);
    };

    loadOrders();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Order Card Component
  const OrderCard = ({ order }) => {
    const handleDelete = (e) => {
      e.stopPropagation(); // agar klik tombol tidak membuka modal
      if (window.confirm("Yakin ingin menghapus pesanan ini?")) {
        const updatedOrders = orders.filter(o => o.id !== order.id);
        setOrders(updatedOrders);
        localStorage.setItem('sayur-yunur-orders', JSON.stringify(updatedOrders));
      }
    };

    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow relative"
        onClick={() => setSelectedOrder(order)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">
              Pesanan #{order.id.toString().slice(-6)}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar size={14} />
              {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Tombol Hapus */}
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-1 rounded-full"
            title="Hapus Pesanan"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-1 mb-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name} x{item.quantity}</span>
              <span className="font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="font-bold text-green-600">Rp {order.total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    );
  };

  // Order Detail Modal
  const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
        <div className="bg-white w-full sm:w-96 sm:max-w-lg max-h-[90vh] sm:rounded-lg overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Detail Pesanan</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-24">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Informasi Pesanan</h3>
              <div className="space-y-1 text-sm">
                <div className="flex"><span className="text-gray-500 w-20">ID:</span><span>#{order.id.toString().slice(-6)}</span></div>
                <div className="flex"><span className="text-gray-500 w-20">Tanggal:</span><span>{formatDate(order.createdAt)}</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">Data Pelanggan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2"><div className="text-gray-500 mt-0.5">👤</div><span>{order.customer.name}</span></div>
                <div className="flex items-start gap-2"><Phone size={14} className="text-gray-500 mt-0.5" /><a href={`tel:${order.customer.phone}`} className="text-blue-600 hover:underline">{order.customer.phone}</a></div>
                <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-500 mt-0.5" /><span className="flex-1">{order.customer.address}</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">Detail Pesanan</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{item.name} x{item.quantity}</span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Catatan</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rp {order.subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Ongkir:</span><span>Rp {order.shipping.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span className="text-green-600">Rp {order.total.toLocaleString('id-ID')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-4">
        <h1 className="text-xl font-semibold">Pesanan Saya</h1>
        {!loading && <p className="text-green-100 text-sm mt-1">{orders.length} pesanan ditemukan</p>}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="border-t pt-2">
                  <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-8 mb-6 inline-block"><Package size={64} className="text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Pesanan yang Anda buat akan muncul di sini</p>
            <div className="w-32 h-1 bg-green-200 rounded-full mx-auto"></div>
          </div>
        ) : (
          <div>{orders.map(order => <OrderCard key={order.id} order={order} />)}</div>
        )}
      </div>

      {/* Modal detail order */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Tombol Feedback Floating */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-20 right-5 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition flex items-center justify-center"
        title="Kirim Feedback"
      >
        <MessageCircle size={24} />
      </button>

      {/* Modal feedback */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};

export default OrdersPage;
