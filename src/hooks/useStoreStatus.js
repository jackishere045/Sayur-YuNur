// src/hooks/useStoreStatus.js
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useStoreStatus = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState(null);
  const [storeHours, setStoreHours] = useState(null);
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

  // Default store hours jika belum ada di Firestore
  const defaultStoreHours = {
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: true },
    sunday: { open: '09:00', close: '17:00', isOpen: true }
  };

  useEffect(() => {
    const loadStoreHours = async () => {
      try {
        const docRef = doc(db, 'settings', 'storeHours');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStoreHours(docSnap.data().hours);
        } else {
          setStoreHours(defaultStoreHours);
        }
      } catch (error) {
        console.error('Error loading store hours:', error);
        setStoreHours(defaultStoreHours);
      } finally {
        setLoading(false);
      }
    };

    loadStoreHours();
  }, []);

  useEffect(() => {
    if (!storeHours) return;

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
      
      // Jika tidak ada hari buka sama sekali
      setNextOpenTime(null);
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [storeHours]);

  return {
    isStoreOpen,
    nextOpenTime,
    storeHours,
    loading
  };
};