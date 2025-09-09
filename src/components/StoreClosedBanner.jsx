// src/components/StoreClosedBanner.jsx
import React from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

const StoreClosedBanner = ({ nextOpenTime }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">
              Maaf, Toko Sedang Tutup
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-2">
            Saat ini toko tidak beroperasi. Anda masih dapat melihat produk tetapi tidak dapat melakukan pemesanan.
          </p>
          {nextOpenTime && (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <Calendar size={16} />
              <span className="font-medium">
                Buka kembali: {nextOpenTime.day}, pukul {nextOpenTime.time}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreClosedBanner;