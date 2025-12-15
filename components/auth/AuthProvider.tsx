'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      // Save user to localStorage when logged in
      if (firebaseUser) {
        saveUserToStorage(firebaseUser);
      } else {
        // Remove from localStorage when logged out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          // Mark user as offline when logging out
          try {
            const { markUserOffline } = await import('@/lib/onlineUsersService');
            // Get previous user ID from storage before clearing
            const prevUser = getUserFromStorage();
            if (prevUser?.uid) {
              markUserOffline(prevUser.uid);
            }
          } catch (error) {
            console.error('❌ Error marking user offline on logout:', error);
          }
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
