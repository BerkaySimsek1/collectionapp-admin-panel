import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  UserCredential,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * E-posta ve şifre ile giriş yapar
 * @param email Kullanıcı e-posta adresi
 * @param password Kullanıcı şifresi
 * @returns Promise<UserCredential>
 */
export const login = (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sistemden çıkış yapar
 * @returns Promise<void>
 */
export const logout = (): Promise<void> => {
  return signOut(auth);
};

/**
 * Yeni bir admin kullanıcısı oluşturur
 * @param email Kullanıcı e-posta adresi
 * @param password Kullanıcı şifresi
 * @returns Promise<UserCredential>
 */
export const register = (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Mevcut kimlik doğrulama durumunu izler
 * @param callback Kullanıcı durumu değiştiğinde çağrılacak fonksiyon
 * @returns Aboneliği sonlandırmak için çağrılacak fonksiyon
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Mevcut kullanıcıyı döndürür
 * @returns Mevcut kullanıcı veya null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
}; 