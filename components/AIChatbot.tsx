'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Location, WeatherData, Incident, Place, MOCK_PLACES } from '@/lib/types';
import { calculateDistance, formatDistance } from '@/lib/utils';
import { callGeminiAI, initGeminiAI } from '@/lib/geminiAI';
import PlaceCard from './PlaceCard';

interface AIChatbotProps {
  userLocation: Location;
  weather: WeatherData | null;
  nearbyIncidents: Incident[];
}

export default function AIChatbot({ userLocation, weather, nearbyIncidents }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Hello! I am your AI assistant. Ask me anything about Da Nang!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Place[]>([]);
  const [geminiReady, setGeminiReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize Gemini AI
    if (initGeminiAI()) {
      setGeminiReady(true);
    }
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

      // Use Gemini AI
      if (geminiReady) {
        try {
          aiResponse = await callGeminiAI(input, {
            userLocation,
            weather,
            nearbyIncidents,
          });
          
          console.log('✅ Gemini AI response received:', aiResponse.substring(0, 100) + '...');
        } catch (geminiError) {
          console.error('Gemini AI error, falling back:', geminiError);
          // Fallback to server-side
          aiResponse = await callServerAI();
        }
      } else {
        // Gemini not ready, use server-side fallback
        aiResponse = await callServerAI();
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Suggest places based on context
      suggestPlacesBasedOnContext();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Server-side fallback AI
  const callServerAI = async (): Promise<string> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        userLocation,
        weather,
        nearbyIncidents,
        usePuter: false,
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.response;
    }
    throw new Error(data.error || 'AI request failed');
  };

  const suggestPlacesBasedOnContext = () => {
    const isRaining = weather?.main?.toLowerCase().includes('rain');
    const hasFlooding = nearbyIncidents.some((i) => i.type === 'flooding');

    // Calculate distances and filter places
    const placesWithDistance = MOCK_PLACES.map((place) => ({
      ...place,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.location.lat,
        place.location.lng
      ),
    })).sort((a, b) => a.distance - b.distance);

    // Smart filtering
    let filteredPlaces = placesWithDistance;
    
    if (isRaining || hasFlooding) {
      // Prioritize indoor places when raining
      filteredPlaces = placesWithDistance.filter((p) => p.isIndoor);
    }

    // Take top 3 nearest places
    setSuggestedPlaces(filteredPlaces.slice(0, 3));
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const quickQuestions = [
    '🌧️ Where to go when it rains?',
    '☕ Nearest coffee shop?',
    '🏖️ Which is the best beach?',
    '🍜 Good restaurants nearby?',
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-grab-green to-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🤖 Smart AI Assistant</h2>
            <p className="text-sm opacity-90">Powered by Google Gemini</p>
          </div>
          {geminiReady && (
            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              ✓ AI Ready
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-grab-green text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
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
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Places */}
      {suggestedPlaces.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-gray-700">📍 Suggested Places</h3>
          <div className="space-y-2">
            {suggestedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} userLocation={userLocation} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-sm p-2 bg-white border border-gray-200 rounded-lg hover:border-grab-green hover:bg-green-50 transition-colors text-left"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask something about Da Nang..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-grab-green focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-grab-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
