'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Incident, Location, WeatherData, DA_NANG_CENTER } from '@/lib/types';
import { getCurrentLocation, getAddressFromCoords } from '@/lib/utils';
import AIChatbot from '@/components/chat/AIChatbot';
import ReportIncidentForm from '@/components/common/ReportIncidentForm';
import SimpleSidebar from '@/components/common/SimpleSidebar';
import MapLegend from '@/components/map/MapLegend';
import { useAuth } from '@/components/auth/AuthProvider';
import { listenToVerifiedIncidents } from '@/lib/incidentServiceFirebase';

const IncidentMap = dynamic(() => import('@/components/map/IncidentMap'), {
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

  // Subscribe to Firebase incident updates (realtime)
  useEffect(() => {
    const unsubscribe = listenToVerifiedIncidents((incidents) => {
      setIncidents(incidents);
      console.log('✅ Updated incidents from Firebase:', incidents.length);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Get user location with better error handling
      try {
        console.log('🔍 Requesting user location...');
        let location = await getCurrentLocation();
        console.log('✅ Got location:', location);
        
        // Check if location is within Da Nang bounds
        const isDaNang = location.lat >= 15.9 && location.lat <= 16.2 && 
                         location.lng >= 107.9 && location.lng <= 108.4;
        
        if (!isDaNang) {
          console.warn('⚠️ Location outside Da Nang, using Da Nang center');
          location = DA_NANG_CENTER;
        }
        
        const address = await getAddressFromCoords(location.lat, location.lng);
        console.log('✅ Got address:', address);
        
        setUserLocation({ ...location, address });
      } catch (error: any) {
        console.error('❌ Error getting location:', error);
        console.warn('⚠️ Using Da Nang center as default location');
        
        const address = await getAddressFromCoords(DA_NANG_CENTER.lat, DA_NANG_CENTER.lng);
        setUserLocation({ ...DA_NANG_CENTER, address });
      }

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
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <SimpleSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      <main className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out h-full relative overflow-hidden
        ${sidebarOpen ? 'ml-64' : 'ml-16'}
      `}>
        <div className="flex-1 flex flex-col h-full p-3 md:p-4 lg:p-6 gap-3 md:gap-4 lg:gap-6 w-full max-w-[1800px] mx-auto min-w-0">
          
          <div className="lg:hidden flex-none z-10">
            <div className="glass rounded-2xl shadow-lg p-1 flex gap-1">
              <button
                onClick={() => setMobileView('map')}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  mobileView === 'map'
                    ? 'bg-grab-green text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <span>🗺️</span>
                <span>Map</span>
              </button>
              <button
                onClick={() => setMobileView('chat')}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  mobileView === 'chat'
                    ? 'bg-grab-green text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <span>💬</span>
                <span>AI Chat</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 relative">
            
            <div className={`
              glass rounded-3xl shadow-xl overflow-hidden relative flex flex-col
              ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
              lg:col-span-2 h-full
            `}>
              <MapLegend />
              <div className="flex-1 relative w-full h-full">
                <IncidentMap
                  center={userLocation}
                  incidents={incidents}
                  onMapClick={handleMapClick}
                />
              </div>
            </div>
            
            <div className={`
              glass rounded-3xl shadow-xl overflow-hidden flex flex-col min-w-0
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
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