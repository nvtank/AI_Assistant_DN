'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Incident, Location, WeatherData, DA_NANG_CENTER, ChatHistory } from '@/lib/types';
import { getCurrentLocation, getAddressFromCoords } from '@/lib/utils';
import AIChatbot from '@/components/AIChatbot';
import ReportIncidentForm from '@/components/ReportIncidentForm';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/components/AuthProvider';
import { getVerifiedIncidents, subscribeToIncidentUpdates } from '@/lib/incidentService';

// Mock chat history data - bạn có thể thay thế bằng API thực tế
const mockChatHistory: ChatHistory[] = [
  { id: '1', title: 'Tìm đường đến sân bay', timestamp: '10:30 AM' },
  { id: '2', title: 'Hỏi về tình trạng giao thông', timestamp: 'Yesterday' },
  { id: '3', title: 'Báo cáo ổ gà trên đường', timestamp: 'Nov 15' },
  { id: '4', title: 'Tìm bãi đỗ xe gần nhất', timestamp: 'Nov 10' },
  { id: '5', title: 'Thời tiết hôm nay', timestamp: 'Nov 5' },
];

// Dynamic import for map component
const IncidentMap = dynamic(() => import('@/components/IncidentMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grab-green mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

const SimpleSidebar = ({ isOpen, onToggle, user }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [connectedUsers, setConnectedUsers] = useState(0);
    
    // Fetch weather for sidebar
    useEffect(() => {
      const fetchSidebarWeather = async () => {
        try {
          const location = DA_NANG_CENTER; // Default to Da Nang
          const response = await fetch(
            `/api/weather?lat=${location.lat}&lon=${location.lng}`
          );
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

  return (
    <aside
      className={`
        h-screen bg-white border-r border-gray-200
        transition-all duration-300
        flex flex-col fixed left-0 top-0 z-50
        ${isOpen ? 'w-64' : 'w-16'}
      `}
    >
      <div className="h-14 flex items-center justify-between px-3 border-b">
        {isOpen && (
          <span className="font-bold text-xl text-grab-green uppercase">Findly</span>
        )}

        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 flex space-y-2 border-b">
          {weather && (
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="text-xl">🌡️</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{Math.round(weather.temp)}°C</p>
                <p className="text-xs text-gray-600 capitalize">{weather.description}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="relative">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full block"></span>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></span>
            </div>
            <span className="text-xs font-medium text-gray-700">
              {connectedUsers} online
            </span>
          </div>
        </div>
      )}
      
      {/* Icons only when closed */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-4 py-4 border-b">
           {weather && (
            <div className="text-center" title={`${Math.round(weather.temp)}°C - ${weather.description}`}>
              <span className="text-xl">🌡️</span>
              <p className="text-[10px] font-bold">{Math.round(weather.temp)}°</p>
            </div>
           )}
           <div className="text-center" title={`${connectedUsers} online`}>
             <div className="w-2.5 h-2.5 bg-green-500 rounded-full mx-auto mb-1"></div>
             <p className="text-[10px] font-bold">{connectedUsers}</p>
           </div>
        </div>
      )}

      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-3">
          <button className="w-full bg-grab-green text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <span>+</span> New Chat
          </button>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">Recent</p>
            {mockChatHistory.map(chat => (
              <button
                key={chat.id}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">{chat.title}</p>
                <p className="text-xs text-gray-400">{chat.timestamp}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <button className="w-10 h-10 bg-grab-green text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors" title="New Chat">
            +
          </button>
        </div>
      )}

      <div className="border-t p-3">
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="bg-grab-green rounded-full p-0.5">
               <UserMenu showText={false} />
            </div>

            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            )}
        </div>
      </div>
    </aside>
  );
};


export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userLocation, setUserLocation] = useState<Location>(DA_NANG_CENTER);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'chat'>('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Initialize
  useEffect(() => {
    if (user) {
      initializeApp();
    }
  }, [user]);

  // Subscribe to incident updates
  useEffect(() => {
    const unsubscribe = subscribeToIncidentUpdates(() => {
      loadIncidents();
    });
    return () => unsubscribe();
  }, []);

  const loadIncidents = useCallback(() => {
    try {
      const verifiedIncidents = getVerifiedIncidents();
      setIncidents(verifiedIncidents);
      console.log('✅ Loaded incidents:', verifiedIncidents.length);
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  }, []);

  const initializeApp = async () => {
    try {
      // Get user location with better error handling
      try {
        console.log('🔍 Requesting user location...');
        const location = await getCurrentLocation();
        console.log('✅ Got location:', location);
        
        const address = await getAddressFromCoords(location.lat, location.lng);
        console.log('✅ Got address:', address);
        
        setUserLocation({ ...location, address });
      } catch (error: any) {
        console.error('❌ Error getting location:', error);
        console.warn('⚠️ Using Da Nang center as default location');
        
        const address = await getAddressFromCoords(DA_NANG_CENTER.lat, DA_NANG_CENTER.lng);
        setUserLocation({ ...DA_NANG_CENTER, address });
      }

      // Load verified incidents from localStorage
      loadIncidents();

      // Fetch weather
      await fetchWeather(userLocation);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };

  const fetchWeather = async (location: Location) => {
    try {
      const response = await fetch(
        `/api/weather?lat=${location.lat}&lon=${location.lng}`
      );
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
      console.error('Error fetching weather:', error);
    }
  };

  const handleMapClick = useCallback((location: Location) => {
    setReportLocation(location);
    setShowReportForm(true);
  }, []);

  const handleReportSuccess = useCallback(() => {
    setShowReportForm(false);
    setReportLocation(null);
  }, []);

  const nearbyIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const R = 6371;
      const dLat = (incident.location.lat - userLocation.lat) * (Math.PI / 180);
      const dLng = (incident.location.lng - userLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * (Math.PI / 180)) *
          Math.cos(incident.location.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= 5;
    });
  }, [incidents, userLocation]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grab-green to-green-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Findly - AI ASSISTANT</h2>
          <p>Starting up...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <SimpleSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      <main className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out h-full relative
        ${sidebarOpen ? 'ml-64' : 'ml-16'}
      `}>
        <div className="flex-1 flex flex-col h-full p-4 md:p-6 gap-4 w-full max-w-[1800px] mx-auto">
          
          <div className="lg:hidden flex-none z-10">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
              <button
                onClick={() => setMobileView('map')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  mobileView === 'map'
                    ? 'bg-grab-green text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>🗺️</span>
                <span>Map</span>
              </button>
              <button
                onClick={() => setMobileView('chat')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  mobileView === 'chat'
                    ? 'bg-grab-green text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>💬</span>
                <span>AI Chat</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative">
            
            <div className={`
              bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative flex flex-col
              ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
              lg:col-span-2 h-full
            `}>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[400] border border-gray-100">
                  <h3 className="font-semibold text-xs mb-2 uppercase tracking-wider text-gray-500">Legend</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span>🌊</span>
                      <span>Flooding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕳️</span>
                      <span>Pothole</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚧</span>
                      <span>Construction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚗</span>
                      <span>Traffic Jam</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative w-full h-full">
                  <IncidentMap
                    center={userLocation}
                    incidents={incidents}
                    onMapClick={handleMapClick}
                  />
                </div>
            </div>
            
            <div className={`
              bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col
              ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}
              lg:col-span-1 h-full
            `}>
              <AIChatbot
                userLocation={userLocation}
                weather={weather}
                nearbyIncidents={nearbyIncidents}
              />
            </div>
          </div>
        </div>
      </main>

      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm">
          <ReportIncidentForm
            location={reportLocation || userLocation}
            onSuccess={handleReportSuccess}
            onCancel={() => setShowReportForm(false)}
          />
        </div>
      )}
    </div>
  );
}