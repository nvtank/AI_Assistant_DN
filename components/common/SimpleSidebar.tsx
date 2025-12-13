'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeatherData, DA_NANG_CENTER } from '@/lib/types';
import UserMenu from './UserMenu';
import { logOut } from '@/lib/authService';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
}

const mockChatHistory: ChatHistory[] = [
  { id: '1', title: 'Tìm đường đến sân bay', timestamp: '10:30 AM' },
  { id: '2', title: 'Hỏi về tình trạng giao thông', timestamp: 'Yesterday' },
  { id: '3', title: 'Báo cáo ổ gà trên đường', timestamp: 'Nov 15' },
  { id: '4', title: 'Tìm bãi đỗ xe gần nhất', timestamp: 'Nov 10' },
  { id: '5', title: 'Thời tiết hôm nay', timestamp: 'Nov 5' },
];

interface SimpleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
}

export default function SimpleSidebar({ isOpen, onToggle, user }: SimpleSidebarProps) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [connectedUsers] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  useEffect(() => {
    const fetchSidebarWeather = async () => {
      try {
        const response = await fetch(`/api/weather?lat=${DA_NANG_CENTER.lat}&lon=${DA_NANG_CENTER.lng}`);
        const data = await response.json();
        
        if (data.temp !== undefined) {
          setWeather({
            temp: data.temp,
            feels_like: data.feels_like,
            humidity: data.humidity,
            description: data.description,
            main: data.main,
            wind_speed: data.windSpeed,
          });
        }
      } catch (error) {
        console.error('Error fetching weather for sidebar:', error);
      }
    };
    
    fetchSidebarWeather();
  }, []);

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
    setUserMenuOpen(false);
  };

  return (
    <aside className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 shadow-sm ${isOpen ? 'w-64' : 'w-16'}`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200">
        {isOpen && <span className="font-bold text-3xl text-grab-green tracking-tight">Findly</span>}
        <button onClick={onToggle} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
          {isOpen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Weather & Online Status */}
      {isOpen && (
        <div className="p-3 space-y-2 border-b border-gray-200">
          {weather && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200/50">
              <span className="text-xl">🌡️</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{Math.round(weather.temp)}°C</p>
                <p className="text-xs text-gray-600 capitalize">{weather.description}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200/50">
            <div className="relative">
              <span className="w-2.5 h-2.5 bg-grab-green rounded-full block"></span>
              <span className="w-2.5 h-2.5 bg-grab-green rounded-full animate-ping absolute top-0 left-0 opacity-75"></span>
            </div>
            <span className="text-xs font-medium text-gray-700">{connectedUsers} online</span>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <div className="flex flex-col items-center gap-4 py-4 border-b border-white/20">
          {weather && (
            <div className="text-center" title={`${Math.round(weather.temp)}°C - ${weather.description}`}>
              <span className="text-xl">🌡️</span>
              <p className="text-[10px] font-bold text-gray-700">{Math.round(weather.temp)}°</p>
            </div>
          )}
          <div className="text-center" title={`${connectedUsers} online`}>
            <div className="w-2.5 h-2.5 bg-grab-green rounded-full mx-auto mb-1"></div>
            <p className="text-[10px] font-bold text-gray-700">{connectedUsers}</p>
          </div>
        </div>
      )}

      {/* Chat History */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-3">
          <button className="group relative w-full bg-grab-green text-white py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg hover:bg-[#009640] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2 tracking-wider">Recent</p>
            {mockChatHistory.map(chat => (
              <button key={chat.id} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 group">
                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-grab-green">{chat.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{chat.timestamp}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <button className="w-10 h-10 bg-grab-green text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg hover:bg-[#009640] transition-all duration-200" title="New Chat">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* User Menu */}
      <div className="border-t border-gray-200 p-3 relative">
        <div 
          className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'} cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors`}
          onClick={() => isOpen && setUserMenuOpen(!userMenuOpen)}
        >
          <div className="bg-grab-green rounded-full p-0.5 shadow-sm">
            <UserMenu showText={false} />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || user.email.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
        </div>

        {isOpen && userMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)}></div>
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

