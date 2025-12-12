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

const PLANNER_QUESTIONS = [
  { key: 'startDate', question: '📅 When would you like to start your trip? (YYYY-MM-DD)', type: 'date' },
  { key: 'endDate', question: '📅 When will your trip end? (YYYY-MM-DD)', type: 'date' },
  { key: 'adults', question: '👨 How many adults?', type: 'number' },
  { key: 'children', question: '👶 How many children?', type: 'number' },
  { key: 'budgetMin', question: '💰 Minimum budget (VND)?', type: 'number' },
  { key: 'budgetMax', question: '💰 Maximum budget (VND)?', type: 'number' },
  { key: 'style', question: '🎨 Travel style? (relax/adventure/family/couple/cultural/foodie)', type: 'text' },
];

export default function AIChatbot({ userLocation, weather, nearbyIncidents }: AIChatbotProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Mode management
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  
  // Normal chat state
  const [normalMessages, setNormalMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Hello! I am your AI assistant. Ask me anything about Da Nang!\n\n💡 Tip: Switch to Planner mode to create your travel plan.',
      timestamp: new Date(),
    },
  ]);
  
  // Planner chat state  
  const [plannerMessages, setPlannerMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🗺️ Great! Let\'s plan your Da Nang trip together.\n\nI\'ll ask you a few questions to create the perfect itinerary.\n\n' + PLANNER_QUESTIONS[0].question,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Place[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [geminiReady, setGeminiReady] = useState(false);
  
  // Planner state
  const [plannerData, setPlannerData] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCollectingPlanInfo, setIsCollectingPlanInfo] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current messages based on mode
  const messages = chatMode === 'normal' ? normalMessages : plannerMessages;
  const setMessages = chatMode === 'normal' ? setNormalMessages : setPlannerMessages;

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

  // Handle message sending (both normal chat and planner mode)
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
      if (chatMode === 'planner' && isCollectingPlanInfo) {
        // ===== PLANNER MODE: Handle question answers =====
        const currentQ = PLANNER_QUESTIONS[currentQuestionIndex];
        const answer = userInput;
        
        // Validate and store answer
        let validationError = '';
        if (currentQ.key === 'startDate' || currentQ.key === 'endDate') {
          const date = new Date(answer);
          if (isNaN(date.getTime())) {
            validationError = 'Please enter a valid date (e.g., 2024-12-25)';
          } else {
            setPlannerData((prev: any) => ({ ...prev, [currentQ.key]: answer }));
          }
        } else if (currentQ.key === 'adults' || currentQ.key === 'children') {
          const num = parseInt(answer);
          if (isNaN(num) || num < 0) {
            validationError = 'Please enter a valid number';
          } else {
            setPlannerData((prev: any) => ({ ...prev, [currentQ.key]: num }));
          }
        } else if (currentQ.key === 'budgetMin' || currentQ.key === 'budgetMax') {
          const num = parseInt(answer.replace(/[^\d]/g, ''));
          if (isNaN(num) || num < 0) {
            validationError = 'Please enter a valid budget amount';
          } else {
            setPlannerData((prev: any) => ({ ...prev, [currentQ.key]: num }));
          }
        } else if (currentQ.key === 'style') {
          setPlannerData((prev: any) => ({ ...prev, [currentQ.key]: answer }));
        }
        
        if (validationError) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `❌ ${validationError}\n\n${currentQ.question}`,
              timestamp: new Date(),
            },
          ]);
          setLoading(false);
          return;
        }
        
        // Move to next question or generate plan
        if (currentQuestionIndex < PLANNER_QUESTIONS.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Got it!\n\n${PLANNER_QUESTIONS[currentQuestionIndex + 1].question}`,
              timestamp: new Date(),
            },
          ]);
        } else {
          // All questions answered - generate plan
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: '🎉 Perfect! I have all the information. Generating your personalized travel plan...',
              timestamp: new Date(),
            },
          ]);
          
          // Build the request
          const request: TravelPlanRequest = {
            startDate: plannerData.startDate,
            endDate: plannerData.endDate,
            numberOfPeople: {
              adults: plannerData.adults || 2,
              children: plannerData.children || 0,
            },
            budget: {
              min: plannerData.budgetMin || 2000000,
              max: plannerData.budgetMax || 5000000,
              currency: 'VND',
            },
            travelStyle: plannerData.style || 'family',
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
        }
      } else {
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
