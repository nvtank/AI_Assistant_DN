import React from 'react';
import { ActivitySchedule } from '@/lib/types';

interface ActivityCardProps {
  item: ActivitySchedule;
}

export function ActivityCard({ item }: ActivityCardProps) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      attraction: '🏛️',
      restaurant: '🍽️',
      cafe: '☕',
      activity: '🎯',
      rest: '😴',
      transport: '🚗',
      hotel: '🏨',
    };
    return icons[type] || '📍';
  };

  return (
    <div className="flex gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200">
      {/* Time Column */}
      <div className="flex-shrink-0 w-20">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
          <p className="font-bold text-lg text-green-800">{item.time}</p>
          <p className="text-xs text-green-600 mt-1">{item.duration} phút</p>
        </div>
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-3xl shadow-sm">
        {getTypeIcon(item.activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Title and Description */}
        <div>
          <h4 className="font-bold text-xl text-gray-800 mb-1">{item.activity.name}</h4>
          <p className="text-gray-600 text-sm leading-relaxed">{item.activity.description}</p>
        </div>
        
        {/* Notes */}
        {item.notes && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
            <p className="text-sm text-blue-800 font-medium">💡 {item.notes}</p>
          </div>
        )}

        {/* Tips */}
        {item.activity.tips && item.activity.tips.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
            <p className="text-xs font-semibold text-amber-800 mb-2">💡 Mẹo hữu ích:</p>
            <ul className="text-xs text-amber-700 space-y-1.5">
              {item.activity.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cost and Travel Info Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cost */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-full text-sm font-bold border border-green-200">
            <span className="text-base">💰</span>
            {item.activity.estimatedCost > 0 
              ? `${item.activity.estimatedCost.toLocaleString()} VND`
              : 'Miễn phí'
            }
          </span>
          
          {/* Rating */}
          {item.activity.rating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 rounded-full text-sm font-semibold border border-yellow-200">
              <span className="text-base">⭐</span>
              {item.activity.rating}
            </span>
          )}

          {/* Distance */}
          {item.travelDistance && item.travelDistance > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              <span className="text-base">📏</span>
              {item.travelDistance.toFixed(1)} km
            </span>
          )}

          {/* Travel Time */}
          {item.travelTime && item.travelTime > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              <span className="text-base">🕒</span>
              {item.travelTime} phút
            </span>
          )}

          {/* Transport Cost */}
          {item.transportCost && item.transportCost > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-full text-sm font-bold border border-blue-200">
              <span className="text-base">🚖</span>
              Grab: {item.transportCost.toLocaleString()} VND
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {/* Google Maps Button */}
          {item.activity.googleMapsLink && (
            <a 
              href={item.activity.googleMapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Maps</span>
            </a>
          )}

          {/* Phone Number Display */}
          {item.activity.phone && (
            <a 
              href={`tel:${item.activity.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{item.activity.phone}</span>
            </a>
          )}

          {/* Website/Fanpage Button */}
          {item.activity.website && (
            <a 
              href={item.activity.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>Website</span>
            </a>
          )}

          {/* Article Link Button */}
          {item.activity.articleLink && (
            <a 
              href={item.activity.articleLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span>Article</span>
            </a>
          )}

          {/* TikTok Button */}
          {item.activity['tik-tok'] && (
            <a 
              href={item.activity['tik-tok']} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              <span>TikTok</span>
            </a>
          )}

          {/* Social Link Button */}
          {item.activity['social-link'] && (
            <a 
              href={item.activity['social-link']} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-grab-green text-white rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>More info</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
