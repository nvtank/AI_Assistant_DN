'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { logOut } from '@/lib/authService';

interface UserMenuProps {
  showText?: boolean;
  isSidebarOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  inSidebar?: boolean;
}

export default function UserMenu({ showText = true, isSidebarOpen = true, size, inSidebar = false }: UserMenuProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  // Determine avatar size based on sidebar state or explicit size prop
  const getAvatarSize = () => {
    if (size) {
      const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
      };
      return sizes[size];
    }
    // Auto size based on sidebar state
    if (inSidebar) {
      return isSidebarOpen ? 'w-9 h-9' : 'w-8 h-8';
    }
    return 'w-10 h-10';
  };

  const avatarSize = getAvatarSize();

  if (loading) {
    return (
      <div className={`${avatarSize} bg-white/20 rounded-full animate-pulse`}></div>
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
        onClick={() => {
          if (!inSidebar || isSidebarOpen) {
            setMenuOpen(!menuOpen);
          }
        }}
        className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className={`${avatarSize} rounded-full ${inSidebar ? '' : 'border-2 border-white'} object-cover flex-shrink-0`}
            style={{ aspectRatio: '1/1' }}
          />
        ) : (
          <div className={`${avatarSize} rounded-full bg-white text-green-600 flex items-center justify-center font-semibold flex-shrink-0 ${
            inSidebar 
              ? (isSidebarOpen ? 'text-sm' : 'text-xs')
              : 'text-base'
          }`}>
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
