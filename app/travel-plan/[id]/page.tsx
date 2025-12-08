'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TravelPlan, DayPlan, ActivitySchedule } from '@/lib/types';
import { getTravelPlan, updatePlanStatus } from '@/lib/travelPlanService';
import { useAuth } from '@/components/AuthProvider';

export default function TravelPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    loadPlan();
  }, [params.id]);

  const loadPlan = async () => {
    try {
      const planId = params.id as string;
      const data = await getTravelPlan(planId);
      setPlan(data);
    } catch (error) {
      console.error('Error loading plan:', error);
      alert('Không thể tải kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!plan?.id) return;
    try {
      await updatePlanStatus(plan.id, 'confirmed');
      setPlan({ ...plan, status: 'confirmed' });
      alert('✅ Đã xác nhận kế hoạch!');
    } catch (error) {
      console.error('Error confirming plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải kế hoạch...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy kế hoạch</h2>
          <button
            onClick={() => router.push('/travel-planner')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Tạo kế hoạch mới
          </button>
        </div>
      </div>
    );
  }

  const currentDay = plan.days[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🗺️ Kế hoạch du lịch Đà Nẵng
                </h1>
                <p className="text-sm text-gray-600">
                  {plan.request.startDate} đến {plan.request.endDate} • {plan.days.length} ngày
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {plan.status === 'draft' && (
                <button
                  onClick={handleConfirm}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  ✓ Xác nhận kế hoạch
                </button>
              )}
              {plan.status === 'confirmed' && (
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                  ✓ Đã xác nhận
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cost Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">💰 Tổng quan chi phí</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">🏨 Chỗ ở</span>
                  <span className="font-semibold">
                    {plan.totalEstimatedCost.accommodation.toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🍜 Ăn uống</span>
                  <span className="font-semibold">
                    {plan.totalEstimatedCost.food.toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🚗 Di chuyển</span>
                  <span className="font-semibold">
                    {plan.totalEstimatedCost.transportation.toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🎯 Hoạt động</span>
                  <span className="font-semibold">
                    {plan.totalEstimatedCost.activities.toLocaleString()} đ
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <span className="font-bold text-lg text-green-600">
                    {plan.totalEstimatedCost.total.toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Weather Forecast */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">🌤️ Dự báo thời tiết</h3>
              <div className="space-y-3">
                {plan.weatherForecast.map((weather, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{new Date(weather.date).toLocaleDateString('vi-VN')}</p>
                      <p className="text-sm text-gray-600">{weather.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {Math.round(weather.temp.max)}°
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round(weather.temp.min)}°
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">ℹ️ Thông tin chuyến đi</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Số người</p>
                  <p className="font-semibold">
                    {plan.request.numberOfPeople.adults} người lớn, {plan.request.numberOfPeople.children} trẻ em
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Phong cách</p>
                  <p className="font-semibold capitalize">{plan.request.travelStyle}</p>
                </div>
                <div>
                  <p className="text-gray-600">Di chuyển</p>
                  <p className="font-semibold capitalize">{plan.request.transportation}</p>
                </div>
                <div>
                  <p className="text-gray-600">Chỗ ở</p>
                  <p className="font-semibold capitalize">{plan.request.accommodation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Day by Day Schedule */}
          <div className="lg:col-span-2">
            {/* Day Selector */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex gap-2 overflow-x-auto">
                {plan.days.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(idx)}
                    className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                      selectedDay === idx
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Ngày {day.day}
                    <br />
                    <span className="text-xs">
                      {new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Schedule */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Ngày {currentDay.day} - {new Date(currentDay.date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {currentDay.weather.condition} • {Math.round(currentDay.weather.temp.min)}° - {Math.round(currentDay.weather.temp.max)}°
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Chi phí ước tính</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currentDay.estimatedCost.toLocaleString()} đ
                  </p>
                </div>
              </div>

              {/* Weather Recommendation */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                <p className="text-blue-800">{currentDay.weather.recommendation}</p>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {currentDay.schedule && currentDay.schedule.length > 0 ? (
                  currentDay.schedule.map((item, idx) => (
                    <ActivityItem key={idx} item={item} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có lịch trình chi tiết cho ngày này
                  </p>
                )}
              </div>

              {/* Day Notes */}
              {currentDay.notes && currentDay.notes.length > 0 && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h4 className="font-semibold mb-2">📝 Lưu ý:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentDay.notes.map((note, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: ActivitySchedule }) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      attraction: '🏛️',
      restaurant: '🍽️',
      activity: '🎯',
      rest: '😴',
      transport: '🚗',
      hotel: '🏨',
    };
    return icons[type] || '📍';
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Time */}
      <div className="flex-shrink-0 w-20">
        <p className="font-bold text-lg">{item.time}</p>
        <p className="text-xs text-gray-600">{item.duration} phút</p>
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-md">
        {getTypeIcon(item.activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h4 className="font-bold text-lg mb-1">{item.activity.name}</h4>
        <p className="text-gray-600 text-sm mb-2">{item.activity.description}</p>
        
        {item.notes && (
          <p className="text-sm text-gray-500 italic mb-2">💡 {item.notes}</p>
        )}

        {item.activity.tips && item.activity.tips.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-700 mb-1">Tips:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {item.activity.tips.map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3">
          <span className="text-sm font-semibold text-green-600">
            {item.activity.estimatedCost > 0 
              ? `${item.activity.estimatedCost.toLocaleString()} đ`
              : 'Miễn phí'
            }
          </span>
          
          {item.activity.rating && (
            <span className="text-sm text-gray-600">
              ⭐ {item.activity.rating}
            </span>
          )}

          {item.travelTime && (
            <span className="text-sm text-gray-600">
              🚗 {item.travelTime} phút đến điểm tiếp theo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
