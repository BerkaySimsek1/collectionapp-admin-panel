import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Admin } from '../types';

/**
 * Admin koleksiyonundan belirli bir admin belgesini getirir
 * @param uid Kullanıcı ID'si
 * @returns Promise<Admin | null>
 */
export const getAdminByUid = async (uid: string): Promise<Admin | null> => {
  try {
    const docRef = doc(db, 'admin', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Admin;
    }
    
    return null;
  } catch (error) {
    console.error('Admin getirme hatası:', error);
    return null;
  }
};

/**
 * E-posta adresine göre admin kontrolü yapar
 * @param email Admin e-posta adresi
 * @returns Promise<boolean>
 */
export const checkIfAdmin = async (email: string): Promise<boolean> => {
  try {
    const adminRef = collection(db, 'admin');
    const q = query(adminRef, where('adminMail', '==', email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Admin kontrolü hatası:', error);
    return false;
  }
}; 