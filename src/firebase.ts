import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: 'AIzaSyCmV7qovbpWHBKKYM1XqrQoNdDWoMVzu1c',
  authDomain: 'collectionapp-d4e51.firebaseapp.com',
  projectId: 'collectionapp-d4e51',
  storageBucket: 'collectionapp-d4e51.appspot.com',
  messagingSenderId: '651794069374',
  appId: '1:651794069374:web:5f65f3cd62b34a0060652f',
  measurementId: 'G-0RHR9H9Q3H',
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 