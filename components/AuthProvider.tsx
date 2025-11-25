'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, saveUserToStorage, getUserFromStorage } from '@/lib/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get user from localStorage first
    const storedUser = getUserFromStorage();
    if (storedUser) {
      setUser(storedUser as User);
    }

    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      // Save user to localStorage when logged in
      if (firebaseUser) {
        saveUserToStorage(firebaseUser);
      } else {
        // Remove from localStorage when logged out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
