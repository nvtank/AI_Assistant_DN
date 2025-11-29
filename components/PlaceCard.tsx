'use client';

import { Place, Location } from '@/lib/types';
import { formatDistance, openGrabApp } from '@/lib/utils';

interface PlaceCardProps {
  place: Place;
  userLocation: Location;
}

export default function PlaceCard({ place, userLocation }: PlaceCardProps) {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        {/* Image */}
        {place.imageUrl && (
          <div className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-2 sm:p-3">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-1">{place.name}</h4>
            {place.rating && (
              <div className="flex items-center text-[10px] sm:text-xs text-yellow-600">
                <span className="mr-1">⭐</span>
                <span>{place.rating}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-1 sm:line-clamp-2">{place.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] sm:text-xs text-gray-500">
              <span>📍 {formatDistance(place.distance || 0)}</span>
              {place.isIndoor && <span className="text-blue-600 hidden sm:inline">🏠</span>}
            </div>

            <button
              onClick={handleBookGrab}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-grab-green text-white text-[10px] sm:text-xs font-semibold rounded-full hover:bg-green-600 transition-colors flex items-center gap-1"
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
