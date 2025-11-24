'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Incident, Location, WeatherData, DA_NANG_CENTER } from '@/lib/types';
import { initSocket, getSocket } from '@/lib/socket';
import { getCurrentLocation, getAddressFromCoords } from '@/lib/utils';
import AIChatbot from '@/components/AIChatbot';
import ReportIncidentForm from '@/components/ReportIncidentForm';

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
  const [userLocation, setUserLocation] = useState<Location>(DA_NANG_CENTER);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // DON'T request notification permission on page load
      // Will request later when user interacts (e.g., when they report an incident)

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
        
        // Show a non-intrusive notification instead of alert
        console.warn('⚠️ Using Da Nang center as default location');
        
        // Use default Da Nang center
        const address = await getAddressFromCoords(DA_NANG_CENTER.lat, DA_NANG_CENTER.lng);
        setUserLocation({ ...DA_NANG_CENTER, address });
      }

      // Initialize Socket.IO
      const socket = initSocket();

      // Listen for user count
      socket.on('users:count', (count: number) => {
        setConnectedUsers(count);
      });

      // Listen for new incidents
      socket.on('incident:new', (incident: Incident) => {
        setIncidents((prev) => [incident, ...prev]);
        showNotification('🚨 New Incident', incident.description);
      });

      // Fetch initial incidents
      await fetchIncidents();

      // Fetch weather
      await fetchWeather(userLocation);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/incidents`);
      const data = await response.json();
      if (data.success) {
        setIncidents(data.data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchWeather = async (location: Location) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/weather?lat=${location.lat}&lon=${location.lng}`
      );
      const data = await response.json();
      if (data.success) {
        setWeather({
          temp: data.data.main.temp,
          feels_like: data.data.main.feels_like,
          humidity: data.data.main.humidity,
          description: data.data.weather[0].description,
          main: data.data.weather[0].main,
          wind_speed: data.data.wind.speed,
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
    }
  };

  const handleMapClick = (location: Location) => {
    setReportLocation(location);
    setShowReportForm(true);
  };

  const handleReportSuccess = () => {
    setShowReportForm(false);
    setReportLocation(null);
    fetchIncidents();
  };

  const nearbyIncidents = incidents.filter((incident) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grab-green to-green-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Grab The Beyond</h2>
          <p>Starting up...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-grab-green to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                🚗 Grab The Beyond
              </h1>
              <p className="text-sm opacity-90 mt-1">
                Real-time Incident Map & AI Smart Assistant
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    <span>{connectedUsers} users online</span>
                  </div>
                </div>
                {weather && (
                  <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    🌡️ {Math.round(weather.temp)}°C - {weather.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-full relative">
              <IncidentMap
                center={userLocation}
                incidents={incidents}
                onMapClick={handleMapClick}
              />
              
              <button
                onClick={() => setShowReportForm(true)}
                className="absolute bottom-6 right-6 bg-grab-green text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-105 font-semibold flex items-center gap-2 z-[1000]"
              >
                <span className="text-xl">📍</span>
                <span>Report Incident</span>
              </button>

              <div className="absolute top-6 left-6 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                <h3 className="font-semibold text-sm mb-2">Legend:</h3>
                <div className="space-y-1 text-xs">
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
            </div>
          </div>

          <div className="lg:col-span-1">
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
