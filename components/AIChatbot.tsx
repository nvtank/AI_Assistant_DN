"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  Location,
  WeatherData,
  Incident,
  Place,
  MOCK_PLACES,
} from "@/lib/types";
import { calculateDistance } from "@/lib/utils";
import { callGeminiAI, initGeminiAI } from "@/lib/geminiAI";
import PlaceCard from "./PlaceCard";
import TravelPlannerChat from "./TravelPlannerChat";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

interface AIChatbotProps {
  userLocation: Location;
  weather: WeatherData | null;
  nearbyIncidents: Incident[];
}

type ChatMode = "normal" | "planner";
type Language = "en" | "vi";

export default function AIChatbot({
  userLocation,
  weather,
  nearbyIncidents,
}: AIChatbotProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Mode management
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [language, setLanguage] = useState<Language>("en");

  // Voice chat states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false); // Toggle for auto-speak AI responses
  const recognitionRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! I am your AI assistant. Ask me anything about Da Nang!\n\n💡 Tip: Switch to Planner mode to create your travel plan.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Place[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [geminiReady, setGeminiReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Switch between modes
  const switchToPlannerMode = () => {
    if (!user) {
      alert("Please login to create a travel plan");
      router.push("/login");
      return;
    }
    setChatMode("planner");
  };

  const switchToNormalMode = () => {
    setChatMode("normal");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initGeminiAI()) setGeminiReady(true);
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      console.log("✅ Voice features supported!");
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === "en" ? "en-US" : "vi-VN";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Auto-send when speech is finalized
            setTimeout(() => {
              setInput(transcript);
            }, 100);
          } else {
            interimTranscript += transcript;
          }
        }
        if (interimTranscript) {
          setInput(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    } else {
      console.warn(
        "⚠️ Voice features not supported in this browser. Use Chrome or Edge for voice input."
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let aiResponse;

      if (geminiReady) {
        try {
          console.log("📤 Calling Gemini AI with message:", input);
          aiResponse = await callGeminiAI(input, {
            userLocation,
            weather,
            nearbyIncidents,
          });
          console.log("✅ Gemini AI response received:", aiResponse);
        } catch (e) {
          console.error("❌ Gemini AI failed, error:", e);
          console.error("Error details:", (e as Error).message);
          aiResponse = await callServerAI();
        }
      } else {
        console.warn("⚠️ Gemini not ready, using server AI");
        aiResponse = await callServerAI();
      }

      if (!aiResponse || aiResponse.trim() === "") {
        console.error("❌ Empty response received!");
        aiResponse =
          "I'm having trouble processing your request. Please try again.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse, timestamp: new Date() },
      ]);

      // Auto-speak AI response if autoSpeak is enabled
      if (autoSpeak) {
        speakText(aiResponse);
      }

      // Only suggest places if user is asking about places/locations
      const messageLower = input.toLowerCase();
      const isAskingAboutPlaces =
        messageLower.includes("where") ||
        messageLower.includes("recommend") ||
        messageLower.includes("suggest") ||
        messageLower.includes("place") ||
        messageLower.includes("coffee") ||
        messageLower.includes("cafe") ||
        messageLower.includes("restaurant") ||
        messageLower.includes("food") ||
        messageLower.includes("beach") ||
        messageLower.includes("visit") ||
        messageLower.includes("go to") ||
        messageLower.includes("đâu") ||
        messageLower.includes("quán") ||
        messageLower.includes("nhà hàng") ||
        messageLower.includes("địa điểm");

      const isAskingWeatherOnly =
        (messageLower.includes("weather") ||
          messageLower.includes("thời tiết") ||
          messageLower.includes("temperature") ||
          messageLower.includes("nhiệt độ")) &&
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
        {
          role: "assistant",
          content: "❌ Sorry, an error occurred. Please try again.",
          timestamp: new Date(),
        },
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

  // Voice functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "en" ? "en-US" : "vi-VN";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const suggestPlacesBasedOnContext = () => {
    const messageLower = input.toLowerCase();
    const isRaining = weather?.main?.toLowerCase().includes("rain");
    const hasFlooding = nearbyIncidents.some((i) => i.type === "flooding");

    const keywords = {
      coffee: ["coffee", "cafe", "cà phê", "café", "caphe"],
      restaurant: [
        "restaurant",
        "food",
        "eat",
        "quán ăn",
        "nhà hàng",
        "phở",
        "bún",
        "cơm",
      ],
      attraction: [
        "beach",
        "museum",
        "attraction",
        "visit",
        "see",
        "biển",
        "bảo tàng",
      ],
      cafe: ["cafe", "coffee", "cà phê"],
    };

    let userIntent = "";
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

    if (userIntent === "coffee" || userIntent === "cafe") {
      filtered = filtered.filter((p) => p.type === "cafe");
    } else if (userIntent === "restaurant") {
      filtered = filtered.filter((p) => p.type === "restaurant");
    } else if (userIntent === "attraction") {
      filtered = filtered.filter(
        (p) => p.type === "attraction" || p.type === "museum"
      );
    }

    if (isRaining || hasFlooding) {
      filtered = filtered.filter((p) => p.isIndoor);
    }

    if (filtered.length === 0) filtered = placesWithDistance;

    setSuggestedPlaces(filtered.slice(0, 3));
  };

  const quickQuestions = [
    "🌧️ Where to go when it rains?",
    "☕ Nearest coffee shop?",
    "🏖️ Which is the best beach?",
    "🍜 Good restaurants nearby?",
  ];

  return (
    <div className="flex flex-col h-full sm:h-screen bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl sm:text-xl font-bold text-gray-900">
                {chatMode === "normal" ? "AI Assistant" : "Travel Planner"}
              </h1>
              <p className="text-md text-gray-500 hidden sm:block">
                {chatMode === "normal"
                  ? "Your smart companion"
                  : "Create your perfect trip"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {voiceSupported && chatMode === "normal" && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-xs sm:text-sm bg-white text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-grab-green"
              >
                <option value="en">🇬🇧 EN</option>
                <option value="vi">🇻🇳 VI</option>
              </select>
            )}

            {/* {geminiReady && chatMode === 'normal' && (
              <div className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium border border-green-200">
                ✓ AI
              </div>
            )} */}
          </div>
        </div>

        {/* Modern Mode Toggle */}
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          <button
            onClick={switchToNormalMode}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              chatMode === "normal"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Chat
          </button>
          <button
            onClick={switchToPlannerMode}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              chatMode === "planner"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Planner
          </button>
        </div>
      </div>

      {chatMode === "planner" ? (
        <div className="flex-1 overflow-hidden">
          <TravelPlannerChat />
        </div>
      ) : (
        <>
          {/* Modern Chat Box */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm sm:text-base ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-grab-green to-emerald-600 text-white shadow-md rounded-br-sm"
                      : "bg-white text-gray-800 shadow-md border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className="text-[10px] opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white rounded-2xl px-5 py-3 shadow-md border border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-grab-green rounded-full animate-bounce"></div>
                    <div
                      className="w-2.5 h-2.5 bg-grab-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 bg-grab-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {showSuggestions && suggestedPlaces.length > 0 && (
            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50 relative max-h-[200px] overflow-y-auto flex-shrink-0">
              <button
                onClick={() => setShowSuggestions(false)}
                className="absolute right-4 top-4 text-xs px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm transition-all"
              >
                ✕
              </button>

              <h3 className="font-bold mb-4 text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="hidden sm:inline">Recommended for You</span>
                <span className="sm:hidden">Suggestions</span>
              </h3>

              <div className="space-y-2 sm:space-y-3">
                {/* Show only 2 places on mobile, 3 on desktop */}
                {suggestedPlaces.slice(0, 2).map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    userLocation={userLocation}
                  />
                ))}
                {suggestedPlaces.length > 2 && (
                  <div className="hidden sm:block">
                    <PlaceCard
                      key={suggestedPlaces[2].id}
                      place={suggestedPlaces[2]}
                      userLocation={userLocation}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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

          {messages.length <= 1 && (
            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
              <p className="text-sm text-gray-700 mb-3 font-semibold">
                💡 Quick Questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickQuestions.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs sm:text-sm p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-grab-green hover:bg-green-50 transition-all duration-200 text-left"
                  >
                    {question}
                  </button>
                ))}
                {quickQuestions.slice(2).map((question, index) => (
                  <button
                    key={index + 2}
                    onClick={() => setInput(question)}
                    className="hidden sm:block text-xs sm:text-sm p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-grab-green hover:bg-green-50 transition-all duration-200 text-left"
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
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  language === "en" ? "Ask about Da Nang…" : "Hỏi về Đà Nẵng…"
                }
                disabled={loading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-grab-green focus:border-transparent outline-none shadow-sm disabled:bg-gray-100"
              />

              {/* Stop speaking button (when AI is speaking) */}
              {voiceSupported && isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md transition-all text-sm sm:text-base bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  title={language === "en" ? "Stop speaking" : "Dừng đọc"}
                >
                  🔇⏹
                </button>
              )}

              {voiceSupported && !isSpeaking && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md transition-all text-sm sm:text-base ${
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                  }`}
                  title={language === "en" ? "Click to speak" : "Bấm để nói"}
                >
                  {isListening ? "🎙️⏹" : "🎤"}
                </button>
              )}

              {voiceSupported && (
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      autoSpeak
                        ? "bg-white text-white  shadow-md"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-lg">{autoSpeak ? "🔊" : "🔇"}</span>
                  </button>
                </div>
              )}
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-grab-green text-white rounded-xl shadow-md hover:bg-green-600 transition-all disabled:opacity-40 text-sm sm:text-base"
              >
                {loading ? "⏳" : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
