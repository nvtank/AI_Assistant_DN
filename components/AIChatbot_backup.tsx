'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Location, WeatherData, Incident, Place, MOCK_PLACES, TravelPlanRequest } from '@/lib/types';
import { calculateDistance } from '@/lib/utils';
import { callGeminiAI, initGeminiAI } from '@/lib/geminiAI';
import PlaceCard from './PlaceCard';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface AIChatbotProps {
  userLocation: Location;
  weather: WeatherData | null;
  nearbyIncidents: Incident[];
}

type ChatMode = 'normal' | 'planner';

const TRIP_THEMES = [
  { value: 'relax', label: '🏖️ Nghỉ dưỡng', icon: '🏖️' },
  { value: 'adventure', label: '🏔️ Khám phá', icon: '🏔️' },
  { value: 'foodie', label: '🍜 Ăn uống', icon: '🍜' },
  { value: 'photography', label: '� Chụp hình', icon: '📸' },
  { value: 'honeymoon', label: '� Honey-moon', icon: '💑' },
  { value: 'extreme', label: '🪂 Mạo hiểm', icon: '🪂' },
  { value: 'cultural', label: '🏛️ Văn hóa', icon: '�️' },
  { value: 'family', label: '👨‍👩‍👧 Gia đình', icon: '👨‍👩‍👧' },
];

export default function AIChatbot({ userLocation, weather, nearbyIncidents }: AIChatbotProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Mode management
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  
  // Normal chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Hello! I am your AI assistant. Ask me anything about Da Nang!\n\n💡 Tip: Switch to Planner mode to create your travel plan.',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Place[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [geminiReady, setGeminiReady] = useState(false);
  
  // Planner form state
  const [formData, setFormData] = useState({
    startDate: '',
    startDateNote: '',
    endDate: '',
    endDateNote: '',
    numberOfPeople: { adults: 2, children: 0 },
    peopleNote: '',
    budget: { min: 2000000, max: 5000000, currency: 'VND' },
    budgetNote: '',
    tripTheme: 'relax',
    tripThemeNote: '',
    duration: { days: 3, nights: 2 },
    durationNote: '',
    hotelStars: 3,
    hotelNote: '',
    priorities: { hotel: 5, food: 5, experience: 5, transport: 5 },
    prioritiesNotes: { hotel: '', food: '', experience: '', transport: '' },
    specialRequirements: '',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initGeminiAI()) setGeminiReady(true);
  }, []);
  
  // Switch between normal chat and planner mode
  const switchToPlannerMode = () => {
    if (!user) {
      alert('Please login to create a travel plan');
      router.push('/login');
      return;
    }
    setChatMode('planner');
  };
  
  const switchToNormalMode = () => {
    setChatMode('normal');
  };

  // Handle form submit for planner
  const handlePlannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    setLoading(true);

    try {
      const request = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        numberOfPeople: formData.numberOfPeople,
        budget: formData.budget,
        travelStyle: formData.tripTheme,
        hotelStars: formData.hotelStars,
        duration: formData.duration,
        priorities: formData.priorities,
        notes: {
          startDateNote: formData.startDateNote,
          endDateNote: formData.endDateNote,
          peopleNote: formData.peopleNote,
          budgetNote: formData.budgetNote,
          tripThemeNote: formData.tripThemeNote,
          durationNote: formData.durationNote,
          hotelNote: formData.hotelNote,
          prioritiesNotes: formData.prioritiesNotes,
        },
        specialRequirements: formData.specialRequirements,
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
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      router.push(`/travel-plan/${data.planId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle normal chat message sending
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      // ===== NORMAL CHAT MODE: Use AI =====
      let aiResponse;

      if (geminiReady) {
        try {
          aiResponse = await callGeminiAI(userInput, {
            userLocation,
            weather,
              nearbyIncidents,
            });
          } catch (e) {
            aiResponse = await callServerAI();
          }
        } else {
          aiResponse = await callServerAI();
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: aiResponse, timestamp: new Date() },
        ]);

        // Only suggest places if user is asking about places/locations
        const messageLower = userInput.toLowerCase();
        const isAskingAboutPlaces = 
          messageLower.includes('where') ||
          messageLower.includes('recommend') ||
          messageLower.includes('suggest') ||
          messageLower.includes('place') ||
          messageLower.includes('coffee') ||
          messageLower.includes('cafe') ||
          messageLower.includes('restaurant') ||
          messageLower.includes('food') ||
          messageLower.includes('beach') ||
          messageLower.includes('visit') ||
          messageLower.includes('go to') ||
          messageLower.includes('đâu') ||
          messageLower.includes('quán') ||
          messageLower.includes('nhà hàng') ||
          messageLower.includes('địa điểm');

        const isAskingWeatherOnly = 
          (messageLower.includes('weather') || 
           messageLower.includes('thời tiết') || 
           messageLower.includes('temperature') ||
           messageLower.includes('nhiệt độ')) &&
          !isAskingAboutPlaces;

        if (isAskingAboutPlaces && !isAskingWeatherOnly) {
          suggestPlacesBasedOnContext(userInput);
          setShowSuggestions(true);
        } else {
          setSuggestedPlaces([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const callServerAI = async (): Promise<string> => {
    return "I'm having trouble processing your request right now. Please try again in a moment.";
  };

  const suggestPlacesBasedOnContext = (userInput: string) => {
    const messageLower = userInput.toLowerCase();
    const isRaining = weather?.main?.toLowerCase().includes('rain');
    const hasFlooding = nearbyIncidents.some((i) => i.type === 'flooding');

    const keywords = {
      coffee: ['coffee', 'cafe', 'cà phê', 'café', 'caphe'],
      restaurant: ['restaurant', 'food', 'eat', 'quán ăn', 'nhà hàng', 'phở', 'bún', 'cơm'],
      attraction: ['beach', 'museum', 'attraction', 'visit', 'see', 'biển', 'bảo tàng'],
      cafe: ['cafe', 'coffee', 'cà phê'],
    };

    let userIntent = '';
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some((w) => messageLower.includes(w))) {
        userIntent = type;
        break;
      }
    }

    const placesWithDistance = MOCK_PLACES.map((place) => ({
      ...place,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.location.lat,
        place.location.lng
      ),
    })).sort((a, b) => a.distance - b.distance);

    let filtered = placesWithDistance;

    if (userIntent === 'coffee' || userIntent === 'cafe') {
      filtered = filtered.filter((p) => p.type === 'cafe');
    } else if (userIntent === 'restaurant') {
      filtered = filtered.filter((p) => p.type === 'restaurant');
    } else if (userIntent === 'attraction') {
      filtered = filtered.filter((p) => p.type === 'attraction' || p.type === 'museum');
    }

    if (isRaining || hasFlooding) {
      filtered = filtered.filter((p) => p.isIndoor);
    }

    if (filtered.length === 0) filtered = placesWithDistance;

    setSuggestedPlaces(filtered.slice(0, 3));
  };

  const quickQuestions = [
    '🌧️ Where to go when it rains?',
    '☕ Nearest coffee shop?',
    '🏖️ Which is the best beach?',
    '🍜 Good restaurants nearby?',
  ];

  return (
    <div className="flex flex-col h-full sm:h-screen bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-grab-green to-emerald-600 text-white p-3 sm:p-5 rounded-t-2xl shadow-md flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide">
              {chatMode === 'normal' ? 'AI Assistant' : '🗺️ Travel Planner'}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block">
              {chatMode === 'normal' ? 'Your smart travel companion 🌍' : 'Creating your perfect Da Nang trip'}
            </p>
          </div>

          {geminiReady && chatMode === 'normal' && (
            <div className="text-[10px] sm:text-xs bg-white/30 px-2 sm:px-3 py-1 rounded-full shadow-sm">✓ AI</div>
          )}
        </div>
        
        {/* MODE TOGGLE */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={switchToNormalMode}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              chatMode === 'normal'
                ? 'bg-white text-grab-green shadow-md'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={switchToPlannerMode}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              chatMode === 'planner'
                ? 'bg-white text-grab-green shadow-md'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🗺️ Planner
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-grab-green text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
              <p className="text-[10px] opacity-60 mt-1">
                {msg.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* SUGGESTED PLACES (only in normal mode) */}
        {chatMode === 'normal' && showSuggestions && suggestedPlaces.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
              📍 <span>Recommended Places</span>
            </p>
            <div className="grid grid-cols-1 gap-3">
              {suggestedPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} userLocation={userLocation} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK QUESTIONS (only in normal mode when chat is empty) */}
      {chatMode === 'normal' && normalMessages.length === 1 && (
        <div className="px-3 sm:px-5 pb-2 flex gap-2 flex-wrap">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInput(q)}
              className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              chatMode === 'planner' && isCollectingPlanInfo
                ? 'Type your answer...'
                : 'Ask me anything about Da Nang...'
            }
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-grab-green text-sm sm:text-base"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-grab-green text-white p-2 sm:p-3 rounded-full hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
