// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Konfigurasi Firebase - ganti dengan config dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA8ssmDqdxeOoUpE1Va5nYjPHaXyhwG-Bk",
  authDomain: "sayur-yunur.firebaseapp.com",
  projectId: "sayur-yunur",
  storageBucket: "sayur-yunur.firebasestorage.app",
  messagingSenderId: "979040532159",
  appId: "1:979040532159:web:c0cc01beecd32dc40bf80a",
  measurementId: "G-9H4RG20PBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export const auth = getAuth(app);

export default app;