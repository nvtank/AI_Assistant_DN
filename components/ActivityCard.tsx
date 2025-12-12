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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              <span className="text-lg">🗺️</span>
              <span>Xem bản đồ</span>
            </a>
          )}

          {/* Phone Button */}
          {item.activity.phone && (
            <a 
              href={`tel:${item.activity.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              <span className="text-lg">📞</span>
              <span>Gọi ngay</span>
            </a>
          )}

          {/* Website/Fanpage Button */}
          {item.activity.website && (
            <a 
              href={item.activity.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              <span className="text-lg">🌐</span>
              <span>Fanpage</span>
            </a>
          )}

          {/* Article Link Button */}
          {item.activity.articleLink && (
            <a 
              href={item.activity.articleLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:bg-orange-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              <span className="text-lg">📰</span>
              <span>Đọc bài viết</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
