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
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
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
