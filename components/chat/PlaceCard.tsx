'use client';

import React, { useState } from 'react';
import { Place, Location } from '@/lib/types';
import { formatDistance, openGrabApp } from '@/lib/utils';

interface PlaceCardProps {
  place: Place;
  userLocation: Location;
}

export default function PlaceCard({ place, userLocation }: PlaceCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const handleBookGrab = () => {
    // Use Mock Grab App for demo (no real Grab API needed)
    openGrabApp(
      userLocation.lat,
      userLocation.lng,
      place.location.lat,
      place.location.lng,
      place.name,
      true // useMockApp = true for demo
    );
  };

  // Get emoji icon based on place type
  const getPlaceIcon = (name: string) => {
    if (name.includes('Coffee') || name.includes('Cafe')) return '☕';
    if (name.includes('Restaurant') || name.includes('Food')) return '🍜';
    if (name.includes('Beach') || name.includes('Sea')) return '🏖️';
    if (name.includes('Mountain') || name.includes('Hills')) return '⛰️';
    if (name.includes('Bridge')) return '🌉';
    if (name.includes('Museum')) return '🏛️';
    if (name.includes('Market')) return '🏪';
    if (name.includes('Hotel')) return '🏨';
    if (name.includes('Bar') || name.includes('Pub')) return '🍺';
    if (name.includes('Salon') || name.includes('Spa')) return '💇';
    return '📍';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-grab-green/50 transition-all">
      <div className="flex">
        {/* Image or Fallback Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
          {place.imageUrl && !imageError ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <span className="text-3xl sm:text-4xl">{getPlaceIcon(place.name)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-2 sm:p-3">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-1 pr-2">{place.name}</h4>
            {place.rating && (
              <div className="flex items-center text-[10px] sm:text-xs text-yellow-600 font-semibold flex-shrink-0">
                <span className="mr-0.5">⭐</span>
                <span>{place.rating}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-1 sm:line-clamp-2">{place.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-gray-500">
              <span className="font-medium">📍 {formatDistance(place.distance || 0)}</span>
              {place.isIndoor && <span className="text-blue-600 hidden sm:inline">🏠</span>}
            </div>

            <button
              onClick={handleBookGrab}
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-grab-green text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 shadow-sm hover:shadow-md"
            >
              <span>🚗</span>
              <span className="hidden sm:inline">Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
