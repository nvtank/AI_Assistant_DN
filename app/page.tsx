'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Incident, Location, WeatherData, DA_NANG_CENTER } from '@/lib/types';
import { getCurrentLocation, getAddressFromCoords } from '@/lib/utils';
import AIChatbot from '@/components/AIChatbot';
import ReportIncidentForm from '@/components/ReportIncidentForm';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/components/AuthProvider';
import { getVerifiedIncidents, subscribeToIncidentUpdates } from '@/lib/incidentService';

// Dynamic import for map component (to avoid SSR issues with Leaflet)
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
  const [mobileView, setMobileView] = useState<'map' | 'chat'>('map'); // Mobile view toggle

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
    // No need to reload incidents as they need admin approval first
  }, []);

  const nearbyIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Simple distance check (within 5km)
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
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-grab-green to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl uppercase font-bold flex items-center gap-2">
                Findly
                <span className="hidden md:inline">- AI ASSISTANT</span>
              </h1>
              <p className="text-xs sm:text-sm opacity-90 mt-1 hidden sm:block">
                Real-time Incident Map & AI Smart Assistant
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-xs sm:text-sm hidden lg:block">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    <span>{connectedUsers} users online</span>
                  </div>
                </div>
                {weather && (
                  <div className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                    🌡️ {Math.round(weather.temp)}°C
                    <span className="hidden sm:inline"> - {weather.description}</span>
                  </div>
                )}
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6">
        {/* Mobile Toggle Buttons */}
        <div className="lg:hidden flex gap-2 mb-3">
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              mobileView === 'map'
                ? 'bg-grab-green text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            🗺️ Map
          </button>
          <button
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              mobileView === 'chat'
                ? 'bg-grab-green text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            💬 AI Assistant
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-6" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Map Section */}
          <div className={`lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden h-screen ${
            mobileView === 'chat' ? 'hidden lg:block' : ''
          }`}>
            <div className="h-full relative">
              <IncidentMap
                center={userLocation}
                incidents={incidents}
                onMapClick={handleMapClick}
              />
              
              <button
                onClick={() => setShowReportForm(true)}
                className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 bg-grab-green text-white px-3 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-105 font-semibold flex items-center gap-1 sm:gap-2 z-[1000] text-sm sm:text-base"
              >
                <span className="text-lg sm:text-xl">📍</span>
                <span className="hidden sm:inline">Report Incident</span>
                <span className="sm:hidden">Report</span>
              </button>

              {/* Switch to Chat button (mobile only) */}
              <button
                onClick={() => setMobileView('chat')}
                className="lg:hidden absolute bottom-3 left-3 bg-white text-grab-green px-3 py-2 rounded-full shadow-lg hover:bg-gray-50 transition-all font-semibold flex items-center gap-1 z-[1000] text-sm border-2 border-grab-green"
              >
                <span>💬</span>
                <span>AI Chat</span>
              </button>

              <div className="absolute top-2 left-2 sm:top-2 sm:left-12 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-[1000]">
                <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2 hidden sm:block">Legend:</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span>🌊</span>
                    <span className="hidden sm:inline">Flooding</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span>🕳️</span>
                    <span className="hidden sm:inline">Pothole</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span>🚧</span>
                    <span className="hidden sm:inline">Construction</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span>🚗</span>
                    <span className="hidden sm:inline">Traffic Jam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chatbot Section */}
          <div className={`lg:col-span-1 relative h-full ${
            mobileView === 'map' ? 'hidden lg:block' : ''
          }`}>
            <AIChatbot
              userLocation={userLocation}
              weather={weather}
              nearbyIncidents={nearbyIncidents}
            />
          </div>
        </div>
      </div>

      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
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
