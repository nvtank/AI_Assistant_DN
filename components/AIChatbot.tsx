'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Location, WeatherData, Incident, Place, MOCK_PLACES } from '@/lib/types';
import { calculateDistance } from '@/lib/utils';
import { callGeminiAI, initGeminiAI } from '@/lib/geminiAI';
import PlaceCard from './PlaceCard';
import TravelPlannerForm from './TravelPlannerForm';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface AIChatbotProps {
  userLocation: Location;
  weather: WeatherData | null;
  nearbyIncidents: Incident[];
}

type ChatMode = 'normal' | 'planner';

export default function AIChatbot({ userLocation, weather, nearbyIncidents }: AIChatbotProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Mode management
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Switch between modes
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initGeminiAI()) setGeminiReady(true);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let aiResponse;

      if (geminiReady) {
        try {
          aiResponse = await callGeminiAI(input, {
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
      const messageLower = input.toLowerCase();
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
        suggestPlacesBasedOnContext();
        setShowSuggestions(true);
      } else {
        // Hide suggestions for non-place questions
        setSuggestedPlaces([]);
        setShowSuggestions(false);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Sorry, an error occurred. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const callServerAI = async (): Promise<string> => {
    // Fallback to simple response when Gemini fails
    // In production, this should call your API route if you have one
    return "I'm having trouble processing your request right now. Please try again in a moment.";
  };

  const suggestPlacesBasedOnContext = () => {
    const messageLower = input.toLowerCase();
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
              {chatMode === 'normal' ? 'Your smart travel companion 🌍' : 'Create your perfect Da Nang trip'}
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

      {/* CONTENT AREA - Chat or Form based on mode */}
      {chatMode === 'planner' ? (
        <div className="flex-1 overflow-hidden">
          <TravelPlannerForm embedded={true} onBack={switchToNormalMode} />
        </div>
      ) : (
        <>
          {/* CHAT BOX */}
          <div className="flex-1 overflow-y-scroll p-3 sm:p-5 space-y-3 sm:space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm text-sm sm:text-base ${
                message.role === 'user'
                  ? 'bg-grab-green text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <p className="text-[10px] sm:text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* SUGGESTED PLACES */}
      {showSuggestions && suggestedPlaces.length > 0 && (
        <div className="border-t border-gray-200 p-3 sm:p-5 bg-white relative max-h-[150px] sm:max-h-[200px] overflow-y-auto flex-shrink-0">
          <button
            onClick={() => setShowSuggestions(false)}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
          >
            ✖
          </button>

          <h3 className="font-semibold mb-2 sm:mb-3 text-gray-700 text-sm sm:text-lg flex items-center gap-2">
            📍 <span className="hidden sm:inline">Recommended for You</span>
            <span className="sm:hidden">Suggestions</span>
          </h3>

          <div className="space-y-2 sm:space-y-3">
            {/* Show only 2 places on mobile, 3 on desktop */}
            {suggestedPlaces.slice(0, 2).map((place) => (
              <PlaceCard key={place.id} place={place} userLocation={userLocation} />
            ))}
            {suggestedPlaces.length > 2 && (
              <div className="hidden sm:block">
                <PlaceCard key={suggestedPlaces[2].id} place={suggestedPlaces[2]} userLocation={userLocation} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHOW AGAIN BUTTON */}
      {!showSuggestions && (
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex justify-center flex-shrink-0">
          <button
            onClick={() => setShowSuggestions(true)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-300 shadow-sm"
          >
            📍 Show Suggestions
          </button>
        </div>
      )}

      {/* QUICK QUESTIONS */}
      {messages.length <= 1 && (
        <div className="border-t border-gray-200 p-3 sm:p-5 bg-white flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Try asking:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {quickQuestions.slice(0, 2).map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-xs sm:text-sm p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:border-grab-green hover:bg-green-50 transition-all"
              >
                {question}
              </button>
            ))}
            {/* Show all 4 on desktop */}
            {quickQuestions.slice(2).map((question, index) => (
              <button
                key={index + 2}
                onClick={() => setInput(question)}
                className="hidden sm:block text-xs sm:text-sm p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:border-grab-green hover:bg-green-50 transition-all"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="border-t border-gray-200 bg-white p-3 sm:p-4 flex-shrink-0">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about Da Nang…"
            disabled={loading}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-grab-green focus:border-transparent outline-none shadow-sm disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-grab-green text-white rounded-xl shadow-md hover:bg-green-600 transition-all disabled:opacity-40 text-sm sm:text-base"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
