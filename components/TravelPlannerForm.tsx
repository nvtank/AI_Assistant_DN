'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface TravelPlanFormData {
  startDate: string;
  startDateNote: string;
  endDate: string;
  endDateNote: string;
  numberOfPeople: {
    adults: number;
    children: number;
  };
  peopleNote: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  budgetNote: string;
  tripThemes: string[]; // Changed to array for multi-select
  tripThemeNote: string;
  timePreferences: string[]; // Multi-select for time slots
  timePreferenceNote: string;
  hotelStars: number;
  hotelNote: string;
  priorities: {
    hotel: number;
    food: number;
    experience: number;
    transport: number;
  };
  prioritiesNotes: {
    hotel: string;
    food: string;
    experience: string;
    transport: string;
  };
  specialRequirements: string;
}

const TRIP_THEMES = [
  { value: 'relax', label: '🏖️ Relaxation', icon: '🏖️' },
  { value: 'adventure', label: '🏔️ Adventure', icon: '🏔️' },
  { value: 'foodie', label: '🍜 Food & Dining', icon: '🍜' },
  { value: 'photography', label: '📸 Photography', icon: '📸' },
  { value: 'honeymoon', label: '💑 Honeymoon', icon: '💑' },
  { value: 'extreme', label: '🪂 Extreme Sports', icon: '🪂' },
  { value: 'cultural', label: '🏛️ Cultural', icon: '🏛️' },
  { value: 'family', label: '👨‍👩‍👧 Family', icon: '👨‍👩‍👧' },
];

const TIME_SLOTS = [
  { value: 'early_morning', label: '🌅 Early Morning', time: '5:00-7:00', icon: '🌅', description: 'Sunrise, early markets' },
  { value: 'morning', label: '☀️ Morning', time: '8:00-11:00', icon: '☀️', description: 'Sightseeing, museums' },
  { value: 'lunch', label: '🍽️ Lunch Time', time: '12:00-14:00', icon: '🍽️', description: 'Lunch, rest' },
  { value: 'afternoon', label: '🌤️ Afternoon', time: '15:00-17:00', icon: '🌤️', description: 'Beach, parks' },
  { value: 'evening', label: '🌆 Evening', time: '18:00-21:00', icon: '🌆', description: 'Dinner, walking streets' },
  { value: 'night', label: '🌙 Night', time: '22:00-24:00', icon: '🌙', description: 'Bars, nightlife' },
];

interface TravelPlannerFormProps {
  onBack?: () => void; // Optional callback to go back
  embedded?: boolean; // If true, use compact layout for embedded view
}

export default function TravelPlannerForm({ onBack, embedded = false }: TravelPlannerFormProps = {}) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<TravelPlanFormData>({
    startDate: '',
    startDateNote: '',
    endDate: '',
    endDateNote: '',
    numberOfPeople: { adults: 2, children: 0 },
    peopleNote: '',
    budget: { min: 2000000, max: 5000000, currency: 'VND' },
    budgetNote: '',
    tripThemes: ['relax'], // Default to one theme, but allow multiple
    tripThemeNote: '',
    timePreferences: ['morning', 'afternoon', 'evening'], // Default time slots
    timePreferenceNote: '',
    hotelStars: 3,
    hotelNote: '',
    priorities: { hotel: 5, food: 5, experience: 5, transport: 5 },
    prioritiesNotes: { hotel: '', food: '', experience: '', transport: '' },
    specialRequirements: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to create a travel plan');
      router.push('/login');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);

    try {
      // Calculate duration from dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      const nights = diffDays - 1;
      
      // Build request with all form data including notes
      const planRequest = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        numberOfPeople: formData.numberOfPeople,
        budget: formData.budget,
        travelStyle: formData.tripThemes.join(', '), // Join multiple themes
        tripThemes: formData.tripThemes, // Also send as array
        timePreferences: formData.timePreferences, // Send time slots
        hotelStars: formData.hotelStars,
        duration: { days: diffDays, nights: nights },
        priorities: formData.priorities,
        // Include all notes and special requirements
        notes: {
          startDateNote: formData.startDateNote,
          endDateNote: formData.endDateNote,
          peopleNote: formData.peopleNote,
          budgetNote: formData.budgetNote,
          tripThemeNote: formData.tripThemeNote,
          timePreferenceNote: formData.timePreferenceNote,
          hotelNote: formData.hotelNote,
          prioritiesNotes: formData.prioritiesNotes,
        },
        specialRequirements: formData.specialRequirements,
        // Default values
        transportation: 'motorbike',
        accommodation: 'hotel',
        timePreference: { morningStart: 'normal', eveningEnd: 'normal' },
        foodPreferences: [],
        allergies: [],
        restrictions: [],
      };

      const response = await fetch('/api/travel-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planRequest,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      const planId = data.planId || data.plan?.id;
      
      if (!planId) {
        throw new Error('No plan ID returned from server');
      }
      
      router.push(`/travel-plan/${planId}`);
    } catch (error) {
      console.error('Error:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${embedded ? 'h-full' : 'min-h-screen'} bg-gradient-to-b from-green-50 to-white ${embedded ? '' : 'py-6 px-4 sm:px-6 lg:px-8'}`}>
      <div className={`${embedded ? 'h-full' : 'max-w-3xl mx-auto'}`}>
        {/* Header */}
        {!embedded && (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              🗺️ Travel Planner
            </h1>
            <p className="text-gray-600">
              Fill in the details to create your perfect travel plan
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-6 ${embedded ? 'overflow-y-auto h-full pb-20' : ''}`}>
          {/* 1. Start Date */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Trip Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            />
            <textarea
              placeholder="💭 Reason for this date (e.g., holiday, avoid rainy season...)"
              value={formData.startDateNote}
              onChange={(e) => setFormData({ ...formData, startDateNote: e.target.value })}
              className="w-full mt-3 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 2. End Date */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Trip End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            />
            <textarea
              placeholder="💭 Time notes (e.g., weekend only, must return before 5pm...)"
              value={formData.endDateNote}
              onChange={(e) => setFormData({ ...formData, endDateNote: e.target.value })}
              className="w-full mt-3 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 3. Number of People */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              👥 Number of Travelers
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Adults</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      numberOfPeople: { ...formData.numberOfPeople, adults: Math.max(1, formData.numberOfPeople.adults - 1) }
                    })}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                    {formData.numberOfPeople.adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      numberOfPeople: { ...formData.numberOfPeople, adults: formData.numberOfPeople.adults + 1 }
                    })}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Children</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      numberOfPeople: { ...formData.numberOfPeople, children: Math.max(0, formData.numberOfPeople.children - 1) }
                    })}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                    {formData.numberOfPeople.children}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      numberOfPeople: { ...formData.numberOfPeople, children: formData.numberOfPeople.children + 1 }
                    })}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <textarea
              placeholder="💭 Group info (e.g., close friends, family with young kids, elderly members...)"
              value={formData.peopleNote}
              onChange={(e) => setFormData({ ...formData, peopleNote: e.target.value })}
              className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 4. Budget */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              💰 Desired Budget (VND)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Minimum</label>
                <input
                  type="number"
                  value={formData.budget.min}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, min: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  step="100000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Maximum</label>
                <input
                  type="number"
                  value={formData.budget.max}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, max: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  step="100000"
                />
              </div>
            </div>
            <textarea
              placeholder="💭 Budget details (e.g., spend more on food, save on hotels...)"
              value={formData.budgetNote}
              onChange={(e) => setFormData({ ...formData, budgetNote: e.target.value })}
              className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 5. Trip Themes */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              🎯 Trip Themes <span className="text-xs text-gray-500">(Select one or more)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRIP_THEMES.map((theme) => {
                const isSelected = formData.tripThemes.includes(theme.value);
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Remove theme if already selected (but keep at least one)
                        if (formData.tripThemes.length > 1) {
                          setFormData({
                            ...formData,
                            tripThemes: formData.tripThemes.filter(t => t !== theme.value)
                          });
                        }
                      } else {
                        // Add theme
                        setFormData({
                          ...formData,
                          tripThemes: [...formData.tripThemes, theme.value]
                        });
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{theme.icon}</div>
                    <div className="text-xs font-medium">{theme.label.split(' ')[1]}</div>
                  </button>
                );
              })}
            </div>
            <textarea
              placeholder="💭 Detailed preferences (e.g., prefer quiet places, avoid crowds...)"
              value={formData.tripThemeNote}
              onChange={(e) => setFormData({ ...formData, tripThemeNote: e.target.value })}
              className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 6. Time Preferences */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              ⏰ Preferred Time Slots <span className="text-xs text-gray-500">(Select one or more)</span>
            </label>
            <div className="space-y-3">
              {TIME_SLOTS.map((slot) => {
                const isSelected = formData.timePreferences.includes(slot.value);
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Remove slot if already selected (but keep at least one)
                        if (formData.timePreferences.length > 1) {
                          setFormData({
                            ...formData,
                            timePreferences: formData.timePreferences.filter(t => t !== slot.value)
                          });
                        }
                      } else {
                        // Add slot
                        setFormData({
                          ...formData,
                          timePreferences: [...formData.timePreferences, slot.value]
                        });
                      }
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      isSelected
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl">{slot.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{slot.label}</div>
                      <div className="text-xs text-gray-600">{slot.time} • {slot.description}</div>
                    </div>
                    {isSelected && (
                      <div className="text-green-500 font-bold">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            <textarea
              placeholder="💭 Time slot details (e.g., can wake up early for sunrise, prefer to return before 9pm...)"
              value={formData.timePreferenceNote}
              onChange={(e) => setFormData({ ...formData, timePreferenceNote: e.target.value })}
              className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 7. Hotel */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              🏨 Hotel Rating
            </label>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, hotelStars: star })}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                    formData.hotelStars === star
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{'⭐'.repeat(star)}</div>
                  <div className="text-xs text-gray-600 mt-1">{star} star</div>
                </button>
              ))}
            </div>
            <textarea
              placeholder="💭 Special requests (e.g., near beach, mountain view, quiet area, swimming pool...)"
              value={formData.hotelNote}
              onChange={(e) => setFormData({ ...formData, hotelNote: e.target.value })}
              className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
              rows={2}
            />
          </div>

          {/* 8. Cost Priority Levels */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              📊 Cost Priority Levels (1 = Budget, 10 = Luxury)
            </label>
            
            {/* Hotel */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">🏨 Hotel</span>
                <span className="text-sm font-bold text-green-600">{formData.priorities.hotel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.priorities.hotel}
                onChange={(e) => setFormData({
                  ...formData,
                  priorities: { ...formData.priorities, hotel: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <textarea
                placeholder="💭 Hotel priority notes..."
                value={formData.prioritiesNotes.hotel}
                onChange={(e) => setFormData({
                  ...formData,
                  prioritiesNotes: { ...formData.prioritiesNotes, hotel: e.target.value }
                })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-xs bg-gray-50"
                rows={1}
              />
            </div>

            {/* Food & Dining */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">🍽️ Food & Dining</span>
                <span className="text-sm font-bold text-green-600">{formData.priorities.food}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.priorities.food}
                onChange={(e) => setFormData({
                  ...formData,
                  priorities: { ...formData.priorities, food: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <textarea
                placeholder="💭 Food & dining priority notes..."
                value={formData.prioritiesNotes.food}
                onChange={(e) => setFormData({
                  ...formData,
                  prioritiesNotes: { ...formData.prioritiesNotes, food: e.target.value }
                })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-xs bg-gray-50"
                rows={1}
              />
            </div>

            {/* Experiences / Tours */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">🎢 Experiences / Tours</span>
                <span className="text-sm font-bold text-green-600">{formData.priorities.experience}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.priorities.experience}
                onChange={(e) => setFormData({
                  ...formData,
                  priorities: { ...formData.priorities, experience: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <textarea
                placeholder="💭 Experience priority notes..."
                value={formData.prioritiesNotes.experience}
                onChange={(e) => setFormData({
                  ...formData,
                  prioritiesNotes: { ...formData.prioritiesNotes, experience: e.target.value }
                })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-xs bg-gray-50"
                rows={1}
              />
            </div>

            {/* Transportation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">🚗 Transportation</span>
                <span className="text-sm font-bold text-green-600">{formData.priorities.transport}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.priorities.transport}
                onChange={(e) => setFormData({
                  ...formData,
                  priorities: { ...formData.priorities, transport: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <textarea
                placeholder="💭 Transportation priority notes..."
                value={formData.prioritiesNotes.transport}
                onChange={(e) => setFormData({
                  ...formData,
                  prioritiesNotes: { ...formData.prioritiesNotes, transport: e.target.value }
                })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-xs bg-gray-50"
                rows={1}
              />
            </div>
          </div>

          {/* 9. Special Requirements */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Preferences, Habits, and Special Requirements
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Examples: Fear of heights, can't eat spicy food, want to watch sunrise, prefer less crowded places, love nature...
            </p>
            <textarea
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
              placeholder="Enter all other important information you want the AI to know to create a suitable plan..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm min-h-[150px]"
              rows={6}
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating your plan...
                </span>
              ) : (
                '✨ Create Travel Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
