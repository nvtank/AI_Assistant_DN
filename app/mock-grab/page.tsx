'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

type ServiceType = 'grabcar' | 'grabbike' | 'grabpremium' | 'grab6seat';

interface Service {
  id: ServiceType;
  name: string;
  icon: string;
  price: string;
  time: string;
  description: string;
}

export default function MockGrabPage() {
  const [step, setStep] = useState<'input' | 'select' | 'booking' | 'success'>('input');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);

  const services: Service[] = [
    {
      id: 'grabcar',
      name: 'GrabCar',
      icon: '🚗',
      price: '45,000đ',
      time: '3 min',
      description: '4 seats, convenient',
    },
    {
      id: 'grabbike',
      name: 'GrabBike',
      icon: '🏍️',
      price: '15,000đ',
      time: '2 min',
      description: 'Fast, cheap',
    },
    {
      id: 'grabpremium',
      name: 'GrabCar Premium',
      icon: '🚙',
      price: '80,000đ',
      time: '5 min',
      description: '4 seats, high-class',
    },
    {
      id: 'grab6seat',
      name: 'GrabCar 6 Seats',
      icon: '🚐',
      price: '65,000đ',
      time: '4 min',
      description: '6 seats, spacious',
    },
  ];

  const handleNext = () => {
    if (step === 'input' && pickup && destination) {
      setStep('select');
    } else if (step === 'select' && selectedService) {
      setStep('booking');
    }
  };

  const handleBooking = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 2000);
  };

  const handleReset = () => {
    setStep('input');
    setPickup('');
    setDestination('');
    setSelectedService(null);
    setPaymentMethod('cash');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-grab-green text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🚗</span>
              <span>Mock Grab App</span>
            </h1>
            <Link
              href="/"
              className="bg-white text-grab-green px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              ← Back to Main App
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Notice */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
        <div className="container mx-auto">
          <p className="font-bold">📢 Demo Mode - Mock Grab Application</p>
          <p className="text-sm">
            This is a simulation app as we don't have official Grab API access. Real
            integration requires Grab partnership.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Input Locations */}
          {step === 'input' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Where to go?</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Pickup Point
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup location"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-grab-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-grab-green focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleNext}
                  disabled={!pickup || !destination}
                  className="w-full bg-grab-green text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
                >
                  Next: Select Vehicle Type
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Popular destinations:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDestination('My Khe Beach')}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  >
                    🏖️ My Khe Beach
                  </button>
                  <button
                    onClick={() => setDestination('Dragon Bridge')}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  >
                    🐉 Dragon Bridge
                  </button>
                  <button
                    onClick={() => setDestination('Ba Na Hills')}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  >
                    ⛰️ Ba Na Hills
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Service */}
          {step === 'select' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Vehicle Type</h2>

              <div className="space-y-3 mb-6">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedService === service.id
                        ? 'border-grab-green bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{service.icon}</span>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-grab-green">{service.price}</p>
                        <p className="text-sm text-gray-600">{service.time}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg font-bold hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedService}
                  className="flex-1 bg-grab-green text-white py-4 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Booking Confirmation */}
          {step === 'booking' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Booking Confirmation</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">From</p>
                  <p className="font-semibold">📍 {pickup}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">To</p>
                  <p className="font-semibold">🎯 {destination}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                  <p className="font-semibold">
                    {services.find((s) => s.id === selectedService)?.icon}{' '}
                    {services.find((s) => s.id === selectedService)?.name}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                  <p className="font-bold text-xl text-grab-green">
                    {services.find((s) => s.id === selectedService)?.price}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        paymentMethod === 'cash'
                          ? 'border-grab-green bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        paymentMethod === 'card'
                          ? 'border-grab-green bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      💳 Card
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={isLoading}
                className="w-full bg-grab-green text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>Booking...</span>
                  </span>
                ) : (
                  `Book ${services.find((s) => s.id === selectedService)?.name}`
                )}
              </button>

              <button
                onClick={() => setStep('select')}
                className="w-full mt-3 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-4 text-grab-green">Booking Successful!</h2>
              <p className="text-gray-600 mb-8">
                Your {services.find((s) => s.id === selectedService)?.name} will arrive in{' '}
                {services.find((s) => s.id === selectedService)?.time}
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-semibold">Nguyen Van A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Plate:</span>
                    <span className="font-semibold">43A-12345</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-semibold">⭐ 4.9 (1,234 trips)</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-grab-green text-white py-4 rounded-lg font-bold mb-3 hover:bg-green-600">
                📞 Call Driver
              </button>

              <button
                onClick={handleReset}
                className="w-full bg-gray-200 text-gray-800 py-4 rounded-lg font-bold hover:bg-gray-300"
              >
                Book Another Trip
              </button>

              <p className="text-sm text-gray-500 mt-4">
                💡 This is a demo. Real Grab integration requires official API access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
