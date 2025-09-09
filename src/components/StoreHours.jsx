// src/components/StoreHours.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const StoreHours = ({ onStoreStatusChange }) => {
  const [storeHours, setStoreHours] = useState({
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: true },
    sunday: { open: '09:00', close: '17:00', isOpen: true }
  });
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState(null);
  const [loading, setLoading] = useState(true);

  const dayNames = {
    monday: 'Senin',
    tuesday: 'Selasa', 
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu'
  };

  // Load jam operasional dari Firestore
  useEffect(() => {
    const loadStoreHours = async () => {
      try {
        const docRef = doc(db, 'settings', 'storeHours');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStoreHours(docSnap.data().hours);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading store hours:', error);
        setLoading(false);
      }
    };

    loadStoreHours();
  }, []);

  // Cek status toko setiap menit
  useEffect(() => {
    const checkStoreStatus = () => {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5); // Format HH:MM
      
      const todayHours = storeHours[currentDay];
      
      if (!todayHours.isOpen) {
        setIsStoreOpen(false);
        findNextOpenTime(now);
        return;
      }
      
      const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
      setIsStoreOpen(isOpen);
      
      if (!isOpen) {
        findNextOpenTime(now);
      }
      
      // Callback untuk parent component
      if (onStoreStatusChange) {
        onStoreStatusChange(isOpen);
      }
    };

    const findNextOpenTime = (currentDate) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let nextDate = new Date(currentDate);
      
      for (let i = 0; i < 7; i++) {
        const dayIndex = (nextDate.getDay() + i) % 7;
        const dayKey = days[dayIndex];
        const dayHours = storeHours[dayKey];
        
        if (dayHours.isOpen) {
          if (i === 0) {
            // Hari ini - cek apakah masih ada waktu buka
            const currentTime = currentDate.toTimeString().slice(0, 5);
            if (currentTime < dayHours.open) {
              setNextOpenTime({
                day: dayNames[dayKey],
                time: dayHours.open,
                date: nextDate
              });
              return;
            }
          } else {
            // Hari lain
            const openDate = new Date(nextDate);
            openDate.setDate(openDate.getDate() + i);
            setNextOpenTime({
              day: dayNames[dayKey],
              time: dayHours.open,
              date: openDate
            });
            return;
          }
        }
      }
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [storeHours, onStoreStatusChange]);

  // Simpan perubahan jam operasional
  const saveStoreHours = async () => {
    try {
      const docRef = doc(db, 'settings', 'storeHours');
      await setDoc(docRef, { hours: storeHours });
      alert('Jam operasional berhasil disimpan!');
    } catch (error) {
      console.error('Error saving store hours:', error);
      alert('Gagal menyimpan jam operasional.');
    }
  };

  const updateDayHours = (day, field, value) => {
    setStoreHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Toko */}
      <div className={`p-4 rounded-lg ${isStoreOpen ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock size={20} className={isStoreOpen ? 'text-green-600' : 'text-red-600'} />
          <h3 className={`font-semibold ${isStoreOpen ? 'text-green-800' : 'text-red-800'}`}>
            Toko {isStoreOpen ? 'BUKA' : 'TUTUP'}
          </h3>
        </div>
        
        {!isStoreOpen && nextOpenTime && (
          <div className="flex items-center gap-2 text-sm text-red-700">
            <Calendar size={16} />
            <span>
              Buka kembali: {nextOpenTime.day}, {nextOpenTime.time}
            </span>
          </div>
        )}
      </div>

      {/* Jam Operasional */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} />
          Jam Operasional
        </h3>
        
        <div className="space-y-3">
          {Object.entries(storeHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hours.isOpen}
                  onChange={(e) => updateDayHours(day, 'isOpen', e.target.checked)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="font-medium text-gray-700 w-16">
                  {dayNames[day]}
                </span>
              </div>
              
              {hours.isOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Tutup</span>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={saveStoreHours}
          className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Simpan Jam Operasional
        </button>
      </div>
    </div>
  );
};

export default StoreHours;