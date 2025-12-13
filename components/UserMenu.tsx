'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { logOut } from '@/lib/authService';

interface UserMenuProps {
  showText?: boolean;
}

export default function UserMenu({ showText = true }: UserMenuProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/login')}
          className="px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white hover:text-gray-200 font-semibold transition-colors"
        >
          Login
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-white text-green-600 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-green-600 flex items-center justify-center text-sm sm:text-base font-semibold">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <span className={`hidden md:block font-medium text-white text-sm ${!showText ? '!hidden' : ''}`}>
          {user.displayName || user.email?.split('@')[0]}
        </span>
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg py-2 z-20">
            <div className="px-3 sm:px-4 py-2 border-b border-gray-200">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => {
                router.push('/admin');
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span>🛡️</span>
              <span>Admin Dashboard</span>
            </button>
            <button
              onClick={() => {
                router.push('/profile');
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
