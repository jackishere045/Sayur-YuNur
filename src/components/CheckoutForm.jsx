// src/components/CheckoutForm.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, Truck, Loader } from 'lucide-react';
import { saveOrder, getLastCustomer } from '../utils/orderUtils';
import { useCart } from '../context/CartContext';

const CheckoutForm = ({ selectedItems, total, onClose }) => {
  const { dispatch } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    shipping: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('loading'); // loading, success, error
  const [distance, setDistance] = useState(null);

  // Koordinat toko
  const STORE_LAT = -7.612214173928771;
  const STORE_LNG = 110.1691279294347;

  // Prefill data customer terakhir
  useEffect(() => {
    const last = getLastCustomer();
    if (last) {
      setFormData(prev => ({
        ...prev,
        ...last,
        shipping: 0 // Reset shipping untuk perhitungan ulang
      }));
    }
  }, []);

  // Fungsi untuk menghitung jarak menggunakan Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fungsi untuk menentukan ongkir berdasarkan jarak
  const calculateShipping = (distanceKm) => {
    if (distanceKm < 1) return 2000;
    if (distanceKm >= 1 && distanceKm <= 3) return 3000;
    if (distanceKm > 3 && distanceKm <= 5) return 4000;
    return 5000; // > 5 km
  };

  // Fungsi untuk mendapatkan lokasi user
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrors(prev => ({ ...prev, location: 'Browser tidak mendukung geolocation' }));
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Hitung jarak ke toko
        const distanceKm = calculateDistance(userLat, userLng, STORE_LAT, STORE_LNG);
        const shippingCost = calculateShipping(distanceKm);
        
        setDistance(distanceKm);
        setFormData(prev => ({ ...prev, shipping: shippingCost }));
        setLocationStatus('success');
        
        // Clear error location jika ada
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: '' }));
        }
      },
      (error) => {
        setLocationStatus('error');
        let errorMessage = '';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin akses lokasi ditolak. Silakan aktifkan lokasi dan refresh halaman.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Request timeout. Silakan coba lagi.';
            break;
          default:
            errorMessage = 'Terjadi kesalahan saat mengambil lokasi.';
            break;
        }
        
        setErrors(prev => ({ ...prev, location: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache lokasi selama 5 menit
      }
    );
  };

  // Ambil lokasi saat komponen dimount
  useEffect(() => {
    getUserLocation();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama harus diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat harus diisi';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor HP harus diisi';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor HP tidak valid';
    }
    if (locationStatus !== 'success') {
      newErrors.location = 'Lokasi diperlukan untuk menghitung ongkir';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (selectedItems.length === 0) {
      alert('Tidak ada item yang dipilih');
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotal = total;
      const shipping = formData.shipping;
      const order = {
        id: Date.now(),
        items: selectedItems,
        subtotal,
        shipping,
        total: subtotal + shipping,
        notes: formData.notes,
        customer: {
          name: formData.name,
          address: formData.address,
          phone: formData.phone
        },
        status: 'Menunggu',
        distance: distance // Simpan jarak untuk referensi
      };

      // Simpan ke localStorage
      saveOrder(order);

      // Buat pesan WA
      const message = `Halo, saya ingin pesan:\n\n${order.items
        .map((i) => `- ${i.name} x${i.quantity} (Rp ${(i.price * i.quantity).toLocaleString('id-ID')})`)
        .join('\n')}\n\nSubtotal: Rp ${subtotal.toLocaleString('id-ID')}\nOngkir: Rp ${shipping.toLocaleString('id-ID')} (${distance?.toFixed(1)} km)\nTotal: Rp ${(order.total).toLocaleString('id-ID')}\n\nNama: ${formData.name}\nAlamat: ${formData.address}\nHP: ${formData.phone}\nCatatan: ${formData.notes || '-'}\n\nTerima kasih`;

      // Redirect ke WhatsApp
      window.open(`https://wa.me/6287833415425?text=${encodeURIComponent(message)}`, '_blank');

      // Kosongkan keranjang setelah checkout
      dispatch({ type: 'CLEAR_SELECTED' });

      // Tutup modal
      onClose();
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getShippingLabel = (distanceKm) => {
    if (distanceKm < 1) return 'Sangat Dekat';
    if (distanceKm >= 1 && distanceKm <= 3) return 'Dalam Kota';
    if (distanceKm > 3 && distanceKm <= 5) return 'Pinggiran Kota';
    return 'Luar Kota';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center bottom-[56px]">
      <div className="bg-white w-full sm:w-96 sm:max-w-lg max-h-[90vh] sm:rounded-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Checkout</h2>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Nama */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} /> Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Masukkan nama lengkap"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          {/* Alamat */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} /> Alamat Lengkap
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              rows="3"
              placeholder="Masukkan alamat lengkap dengan patokan"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          
          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} /> Nomor HP
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Masukkan nomor HP"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          
          {/* Ongkir Otomatis */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Truck size={16} /> Ongkos Kirim (Otomatis)
            </label>
            
            {locationStatus === 'loading' && (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-blue-50">
                <Loader size={20} className="animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Mengambil lokasi...</p>
                  <p className="text-sm text-blue-600">Mohon izinkan akses lokasi</p>
                </div>
              </div>
            )}
            
            {locationStatus === 'success' && distance !== null && (
              <div className="p-3 border rounded-md bg-green-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-green-800">
                    {getShippingLabel(distance)} ({distance.toFixed(1)} km)
                  </span>
                  <span className="font-semibold text-green-600">
                    Rp {formData.shipping.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Jarak dari toko ke lokasi Anda
                </p>
              </div>
            )}
            
            {locationStatus === 'error' && (
              <div className="space-y-2">
                <div className="p-3 border rounded-md bg-red-50">
                  <p className="font-medium text-red-800">Gagal mengambil lokasi</p>
                  <p className="text-sm text-red-600">
                    {errors.location || 'Tidak dapat mendeteksi lokasi Anda'}
                  </p>
                </div>
                <button
                  onClick={getUserLocation}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            )}
            
            {errors.location && locationStatus !== 'error' && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (opsional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows="2"
              placeholder="Tambahan permintaan atau catatan"
            />
          </div>
        </div>
        
        {/* Summary & Submit */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({selectedItems.length} item):</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ongkir:</span>
              <span>
                {locationStatus === 'success' 
                  ? `Rp ${formData.shipping.toLocaleString('id-ID')}`
                  : locationStatus === 'loading' 
                    ? 'Menghitung...'
                    : 'Rp 0'
                }
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">
                Rp {(total + formData.shipping).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedItems.length === 0 || locationStatus !== 'success'}
            className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting 
              ? 'Memproses...' 
              : locationStatus === 'loading'
                ? 'Menunggu Lokasi...'
                : 'Beli Sekarang via WhatsApp'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;