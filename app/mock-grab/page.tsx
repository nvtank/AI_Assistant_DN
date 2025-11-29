'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Location, DA_NANG_CENTER } from '@/lib/types';
import { getCurrentLocation, calculateDistance, formatDistance } from '@/lib/utils';

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  description: string;
  pricePerKm: number;
  basePrice: number;
}

const VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'bike',
    name: 'GrabBike',
    icon: '🏍️',
    description: 'Fast & affordable',
    pricePerKm: 5000,
    basePrice: 10000,
  },
  {
    id: 'car',
    name: 'GrabCar',
    icon: '🚗',
    description: '4-seater, A/C',
    pricePerKm: 10000,
    basePrice: 20000,
  },
  {
    id: 'car-plus',
    name: 'GrabCar Plus',
    icon: '🚙',
    description: '6-seater, premium',
    pricePerKm: 15000,
    basePrice: 30000,
  },
];

export default function MockGrabPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(VEHICLE_TYPES[0]);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'selecting' | 'confirming' | 'booking' | 'booked'>('selecting');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [distance, setDistance] = useState(0);

  // Get location from URL params
  useEffect(() => {
    const initLocations = async () => {
      try {
        // Get pickup location (user's current location)
        const currentLocation = await getCurrentLocation();
        setPickup(currentLocation);

        // Get destination from URL params
        const destLat = searchParams.get('lat');
        const destLng = searchParams.get('lng');
        const destName = searchParams.get('name') || 'Destination';
        const destAddress = searchParams.get('address') || '';

        if (destLat && destLng) {
          const dest: Location = {
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
            address: destAddress || destName,
          };
          setDestination(dest);

          // Calculate distance and price
          const dist = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            dest.lat,
            dest.lng
          );
          setDistance(dist);
          calculatePrice(dist, VEHICLE_TYPES[0]);
        }
      } catch (error) {
        console.error('Error initializing locations:', error);
        // Fallback to Da Nang center
        setPickup(DA_NANG_CENTER);
      } finally {
        setLoading(false);
      }
    };

    initLocations();
  }, [searchParams]);

  const calculatePrice = (dist: number, vehicle: VehicleType) => {
    const price = vehicle.basePrice + (dist * vehicle.pricePerKm);
    setEstimatedPrice(Math.round(price / 1000) * 1000); // Round to nearest 1000
  };

  const handleVehicleSelect = (vehicle: VehicleType) => {
    setSelectedVehicle(vehicle);
    calculatePrice(distance, vehicle);
  };

  const handleBookRide = () => {
    setBookingStep('confirming');
  };

  const handleConfirmBooking = () => {
    setBookingStep('booking');
    
    // Simulate booking process
    setTimeout(() => {
      setBookingStep('booked');
    }, 2000);
  };

  const handleBackToApp = () => {
    router.push('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-green-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Grab...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Destination Set</h1>
          <p className="text-gray-600 mb-6">Please select a destination from the main app.</p>
          <button
            onClick={handleBackToApp}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-lg">
        <button
          onClick={handleBackToApp}
          className="text-white hover:text-gray-200 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Book a Grab</h1>
        <div className="w-6"></div>
      </div>

      {/* Booking Panel - Full screen */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {/* Demo Disclaimer - Top */}
        <div className="mb-4 max-w-md mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💡</span>
              <div className="flex-1">
                <p className="text-xs text-blue-800 font-semibold">Demo Mode</p>
                <p className="text-[10px] text-blue-600">
                  Mock application - Real implementation if selected for next round
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Route Illustration */}
        {pickup && destination && bookingStep === 'selecting' && (
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-2">
                  📍
                </div>
                <p className="text-xs text-gray-500">Pickup</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="flex-1 h-1 bg-gradient-to-r from-green-400 to-red-400 rounded-full relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md">
                    🚗
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-2">
                  🎯
                </div>
                <p className="text-xs text-gray-500">Destination</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Distance: <span className="font-bold text-green-600">{formatDistance(distance)}</span>
              </p>
            </div>
          </div>
        )}
        
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
        {bookingStep === 'selecting' && (
          <>
            {/* Route Info */}
            <div className="mb-6">
              <div className="flex items-start mb-3">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-semibold text-gray-800">
                      {pickup?.address || 'Your Location'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-semibold text-gray-800">
                      {destination?.address || 'Destination'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Distance: <span className="font-semibold ml-1">{formatDistance(distance)}</span>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Choose a ride</h3>
              <div className="space-y-3">
                {VEHICLE_TYPES.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                      selectedVehicle.id === vehicle.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{vehicle.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{vehicle.name}</p>
                        <p className="text-sm text-gray-500">{vehicle.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatPrice(vehicle.basePrice + (distance * vehicle.pricePerKm))}
                      </p>
                      <p className="text-xs text-gray-500">2-5 min</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookRide}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg"
            >
              Book {selectedVehicle.name}
            </button>
          </>
        )}

        {bookingStep === 'confirming' && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">{selectedVehicle.icon}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Your Ride</h2>
            <p className="text-gray-600 mb-6">
              {selectedVehicle.name} • {formatDistance(distance)}
            </p>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Base fare</span>
                <span className="font-semibold">{formatPrice(selectedVehicle.basePrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Distance ({formatDistance(distance)})</span>
                <span className="font-semibold">{formatPrice(distance * selectedVehicle.pricePerKm)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-green-600">{formatPrice(estimatedPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBookingStep('selecting')}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {bookingStep === 'booking' && (
          <div className="text-center py-12">
            <div className="animate-bounce text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Finding a driver...</h2>
            <p className="text-gray-600">Please wait while we match you with a driver</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </div>
        )}

        {bookingStep === 'booked' && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ride Booked!</h2>
            <p className="text-gray-600 mb-4">Your driver is on the way</p>
            
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">
                    D
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Driver Name</p>
                    <p className="text-sm text-gray-600">{selectedVehicle.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">⭐ 4.9</p>
                  <p className="text-xs text-gray-600">99 trips</p>
                </div>
              </div>
              <div className="text-center py-2 bg-white rounded-lg">
                <p className="text-sm text-gray-600">License Plate</p>
                <p className="text-2xl font-bold text-gray-800">43A-123.45</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⏱️ Driver will arrive in <span className="font-bold">5 minutes</span>
              </p>
            </div>

            <button
              onClick={handleBackToApp}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
            >
              Back to App
            </button>
          </div>
        )}
        
        {/* Full Disclaimer - Bottom */}
        <div className="mt-6 mb-4 max-w-md mx-auto">
          <div className="bg-white border-2 border-blue-300 rounded-xl p-5 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="text-3xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">📱 Mock Demo Application</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  This is a <span className="font-bold text-blue-600">demonstration version</span> showcasing 
                  the user experience and booking workflow. All features (driver info, pricing, ETA) are 
                  <span className="font-bold"> simulated</span> for presentation purposes.
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-bold text-green-900 mb-3 flex items-center">
                    <span className="mr-2">🏆</span>
                    If Selected for Next Round, We Will Implement:
                  </p>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span><strong>Real Grab API</strong> integration with official deep links and live booking system</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span><strong>Live driver tracking</strong> with real-time GPS updates and route optimization</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span><strong>Secure backend server</strong> for payment processing, user authentication & data storage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span><strong>Production deployment</strong> with proper infrastructure, monitoring, and scaling capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span><strong>Additional features:</strong> Ride history, payment methods, promo codes, scheduling, and more</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
