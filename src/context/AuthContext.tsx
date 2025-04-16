import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
  onAuthStateChange,
  login,
  logout,
  register,
  getCurrentUser,
} from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Context tipi tanımı
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
}

// Context'in varsayılan değeri
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  loading: true,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
};

// Context oluşturma
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Context hook'u
export const useAuth = () => useContext(AuthContext);

// Context Provider bileşeni
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth durumunu izleme
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          // Admin koleksiyonundan ek bilgileri al
          const adminRef = doc(db, "admin", user.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const adminData = adminSnap.data();

            // Firebase User nesnesini doğrudan değiştiremeyiz,
            // bu yüzden geçici bir nesne oluşturup onu döndürüyoruz
            const enhancedUser = { ...user };

            // Profil fotoğrafı yoksa admin koleksiyonundan al
            if (!user.photoURL && adminData.photoURL) {
              Object.defineProperty(enhancedUser, "photoURL", {
                value: adminData.photoURL,
                writable: true,
              });
              console.log("Admin fotoğrafı yüklendi:", adminData.photoURL);
            } else if (!user.photoURL) {
              // Varsayılan profil fotoğrafı
              Object.defineProperty(enhancedUser, "photoURL", {
                value: "https://via.placeholder.com/150?text=Admin",
                writable: true,
              });
              console.log("Varsayılan admin fotoğrafı atandı");
            }

            // Ekran adı yoksa admin koleksiyonundan al
            if (!user.displayName && adminData.adminName) {
              Object.defineProperty(enhancedUser, "displayName", {
                value: adminData.adminName,
                writable: true,
              });
              console.log("Admin adı yüklendi:", adminData.adminName);
            }

            setCurrentUser(enhancedUser);
          } else {
            // Admin koleksiyonunda veri yoksa bile varsayılan profil fotoğrafını ayarla
            if (!user.photoURL) {
              const enhancedUser = { ...user };
              Object.defineProperty(enhancedUser, "photoURL", {
                value: "https://via.placeholder.com/150?text=Admin",
                writable: true,
              });
              setCurrentUser(enhancedUser);
              console.log(
                "Admin verisi bulunamadı, varsayılan fotoğraf atandı"
              );
            } else {
              setCurrentUser(user);
            }
          }
        } catch (error) {
          console.error("Admin verisi yüklenirken hata:", error);
          // Herhangi bir hata durumunda orijinal kullanıcı nesnesini kullan
          const enhancedUser = { ...user };
          if (!user.photoURL) {
            Object.defineProperty(enhancedUser, "photoURL", {
              value: "https://via.placeholder.com/150?text=Admin",
              writable: true,
            });
          }
          setCurrentUser(enhancedUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Temizleme fonksiyonu
    return unsubscribe;
  }, []);

  // Context değeri
  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
