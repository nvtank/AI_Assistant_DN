"use client";

import React, { useState, useRef, useEffect } from "react";
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
import PlaceCard from "@/components/chat/PlaceCard";
import TravelPlannerChat from "@/components/travel-plan/TravelPlannerChat";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useVoiceRecognition } from "@/components/chat/useVoiceRecognition";
import {
  saveChatConversation,
  updateChatConversation,
  getUserActiveConversation,
  getChatConversation,
} from "@/lib/travelPlanService";
import { Timestamp } from "firebase/firestore";

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
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Voice recognition hook
  const {
    isListening,
    isSpeaking,
    voiceSupported,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    speakText,
    stopSpeaking,
  } = useVoiceRecognition(language);

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
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

  // Check for restart flag and planner mode switch on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldRestart = sessionStorage.getItem('switchToPlannerAndRestart');
      if (shouldRestart === 'true') {
        sessionStorage.removeItem('switchToPlannerAndRestart');
        // Switch to planner mode first
        setChatMode("planner");
        // Then trigger restart after a small delay to ensure component is mounted
        setTimeout(() => {
          window.dispatchEvent(new Event('restartPlanner'));
        }, 300);
      }
      
      // Check if need to switch to planner mode
      const switchToPlanner = sessionStorage.getItem('switchToPlannerMode');
      if (switchToPlanner === 'true') {
        sessionStorage.removeItem('switchToPlannerMode');
        setChatMode("planner");
        // Trigger load conversation event after switching mode
        setTimeout(() => {
          window.dispatchEvent(new Event('loadPlannerConversation'));
        }, 300);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initGeminiAI()) setGeminiReady(true);
  }, []);

  // Load chat history from Firebase when user is logged in
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user || chatMode !== "normal") {
        setLoadingHistory(false);
        return;
      }

      try {
        setLoadingHistory(true);
        
        // Check if there's a specific conversation to load from sidebar
        let conversationToLoad = null;
        if (typeof window !== 'undefined') {
          const loadConversationId = sessionStorage.getItem('loadConversationId');
          if (loadConversationId) {
            console.log('📂 Loading specific conversation:', loadConversationId);
            conversationToLoad = await getChatConversation(loadConversationId);
            sessionStorage.removeItem('loadConversationId');
          }
        }
        
        // If no specific conversation to load, get active one
        if (!conversationToLoad) {
          conversationToLoad = await getUserActiveConversation(user.uid);
        }
        
        if (conversationToLoad && conversationToLoad.messages) {
          // Convert Firestore timestamps to Date objects
          const loadedMessages = conversationToLoad.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
          }));
          
          setMessages(loadedMessages);
          setConversationId(conversationToLoad.id || null);
          console.log('✅ Loaded chat history from Firebase:', loadedMessages.length, 'messages');
        } else {
          // No active conversation, start fresh
          setConversationId(null);
          console.log('ℹ️ No previous chat history found');
        }
      } catch (error) {
        console.error('❌ Error loading chat history:', error);
        // Continue with default messages on error
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
    
    // Listen for load conversation event from sidebar
    const handleLoadConversation = () => {
      console.log('📂 Received loadConversation event');
      loadChatHistory();
    };
    
    // Listen for new chat requested event
    const handleNewChatRequested = async () => {
      console.log('🆕 New chat requested, saving current conversation...');
      
      // Save current conversation before resetting
      if (conversationId && messages.length > 1) {
        // Only save if there are actual messages (more than just welcome message)
        const hasUserMessages = messages.some(msg => msg.role === 'user');
        if (hasUserMessages) {
          try {
            // Mark current conversation as completed
            await updateChatConversation(conversationId, {
              completed: true,
            });
            console.log('💾 Saved current conversation before reset');
          } catch (error) {
            console.error('❌ Error saving conversation:', error);
          }
        }
      }
      
      // Reset chat state
      setMessages([{
        role: "assistant",
        content: "👋 Hello! I am your AI assistant. Ask me anything about Da Nang!\n\n💡 Tip: Switch to Planner mode to create your travel plan.",
        timestamp: new Date(),
      }]);
      setConversationId(null);
      console.log('🔄 Reset chat to new conversation');
    };
    
    // Listen for conversation deleted event
    const handleConversationDeleted = (event: CustomEvent) => {
      const deletedConversationId = event.detail?.conversationId;
      console.log('🗑️ Conversation deleted event:', deletedConversationId);
      
      // If all conversations were deleted or current conversation was deleted, reset state
      if (deletedConversationId === 'all' || (deletedConversationId && conversationId === deletedConversationId)) {
        console.log('🔄 Conversation(s) deleted, resetting...');
        setMessages([{
          role: "assistant",
          content: "👋 Hello! I am your AI assistant. Ask me anything about Da Nang!\n\n💡 Tip: Switch to Planner mode to create your travel plan.",
          timestamp: new Date(),
        }]);
        setConversationId(null);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('loadConversation', handleLoadConversation);
      window.addEventListener('newChatRequested', handleNewChatRequested);
      window.addEventListener('chatConversationDeleted', handleConversationDeleted as EventListener);
      return () => {
        window.removeEventListener('loadConversation', handleLoadConversation);
        window.removeEventListener('newChatRequested', handleNewChatRequested);
        window.removeEventListener('chatConversationDeleted', handleConversationDeleted as EventListener);
      };
    }
  }, [user, chatMode, conversationId]);

  // Save chat to Firebase
  const saveChatToFirebase = async (newMessages: ChatMessage[]) => {
    if (!user || chatMode !== "normal") return;

    try {
      // Convert Date objects to Firestore Timestamp
      const messagesForFirestore = newMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date 
          ? Timestamp.fromDate(msg.timestamp)
          : Timestamp.fromDate(new Date(msg.timestamp)),
      }));

      if (conversationId) {
        // Update existing conversation
        await updateChatConversation(conversationId, {
          messages: messagesForFirestore as any,
          completed: false,
        });
        console.log('💾 Updated chat conversation in Firebase');
      } else {
        // Create new conversation
        const newConversationId = await saveChatConversation({
          userId: user.uid,
          messages: messagesForFirestore as any,
          currentStep: 0,
          completed: false,
          createdAt: Timestamp.now() as any, // Will be overwritten by saveChatConversation
          updatedAt: Timestamp.now() as any, // Will be overwritten by saveChatConversation
        });
        setConversationId(newConversationId);
        console.log('💾 Created new chat conversation in Firebase:', newConversationId);
      }
    } catch (error) {
      console.error('❌ Error saving chat to Firebase:', error);
      // Don't block user experience if save fails
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      // Save user message to Firebase immediately
      saveChatToFirebase(updatedMessages);
      return updatedMessages;
    });
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

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, assistantMessage];
        // Save to Firebase asynchronously (don't block UI)
        saveChatToFirebase(updatedMessages);
        return updatedMessages;
      });

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

  const handleStartListening = () => {
    startVoiceListening((text: string) => {
      setInput(text);
    });
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
    <div className="flex flex-col h-full sm:h-screen bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 border-b border-white/30 p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {chatMode === "normal" ? "AI Assistant" : "Travel Planner"}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
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
                className="text-xs sm:text-sm glass text-gray-700 px-3 py-1.5 rounded-xl border border-white/30 hover:border-grab-green/50 focus:outline-none focus:ring-2 focus:ring-grab-green transition-all"
              >
                <option value="en">🇬🇧 EN</option>
                <option value="vi">🇻🇳 VI</option>
              </select>
            )}
          </div>
        </div>

        {/* Modern Mode Toggle */}
        <div className="glass rounded-2xl p-1 flex gap-1 border border-white/30">
          <button
            onClick={switchToNormalMode}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              chatMode === "normal"
                ? "bg-grab-green text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            Chat
          </button>
          <button
            onClick={switchToPlannerMode}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              chatMode === "planner"
                ? "bg-grab-green text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white/50 to-white">
            {loadingHistory && (
              <div className="flex justify-center items-center py-8">
                <div className="text-sm text-gray-500">Loading chat history...</div>
              </div>
            )}
            {!loadingHistory && messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm sm:text-base ${
                    message.role === "user"
                      ? "bg-grab-green text-white shadow-lg rounded-br-sm"
                      : "glass text-gray-800 shadow-md border border-white/30 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`text-[10px] mt-2 ${
                    message.role === "user" ? "opacity-70" : "opacity-50"
                  }`}>
                    {message.timestamp instanceof Date
                      ? message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(message.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="glass rounded-2xl px-5 py-3 shadow-md border border-white/30">
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
            <div className="border-t border-white/30 p-4 sm:p-6 bg-gradient-to-b from-white/50 to-white relative max-h-[200px] overflow-y-auto flex-shrink-0">
              <button
                onClick={() => setShowSuggestions(false)}
                className="absolute right-4 top-4 text-xs px-3 py-1.5 glass hover:bg-white/60 rounded-xl border border-white/30 shadow-sm transition-all text-gray-600"
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
            <div className="border-t border-white/30 p-3 sm:p-4 bg-white/50 flex justify-center flex-shrink-0">
              <button
                onClick={() => setShowSuggestions(true)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm glass hover:bg-white/60 rounded-xl border border-white/30 shadow-sm text-gray-700"
              >
                📍 Show Suggestions
              </button>
            </div>
          )}

          {messages.length <= 1 && (
            <div className="border-t border-white/30 p-4 sm:p-6 bg-gradient-to-b from-white/50 to-white flex-shrink-0">
              <p className="text-sm text-gray-700 mb-3 font-semibold">
                💡 Quick Questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickQuestions.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs sm:text-sm p-3 glass border border-white/30 rounded-xl shadow-sm hover:shadow-md hover:border-grab-green/50 hover:bg-grab-green/5 transition-all duration-200 text-left"
                  >
                    {question}
                  </button>
                ))}
                {quickQuestions.slice(2).map((question, index) => (
                  <button
                    key={index + 2}
                    onClick={() => setInput(question)}
                    className="hidden sm:block text-xs sm:text-sm p-3 glass border border-white/30 rounded-xl shadow-sm hover:shadow-md hover:border-grab-green/50 hover:bg-grab-green/5 transition-all duration-200 text-left"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT */}
          <div className="border-t border-white/30 bg-white/50 p-3 sm:p-4 flex-shrink-0">
            <div className="flex gap-2 sm:gap-3 min-w-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  language === "en" ? "Ask about Da Nang…" : "Hỏi về Đà Nẵng…"
                }
                disabled={loading}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base glass border border-white/30 rounded-xl focus:ring-2 focus:ring-grab-green focus:border-grab-green/50 outline-none shadow-sm disabled:opacity-50"
              />

              {/* Stop speaking button (when AI is speaking) */}
              {voiceSupported && isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg transition-all text-sm sm:text-base bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  title="Stop speaking"
                >
                  🔇⏹
                </button>
              )}

              {voiceSupported && !isSpeaking && (
                <button
                  onClick={isListening ? stopVoiceListening : handleStartListening}
                  disabled={loading}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg transition-all text-sm sm:text-base ${
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-grab-green text-white hover:bg-[#009640] disabled:opacity-40"
                  }`}
                  title="Click to speak"
                >
                  {isListening ? "🎙️⏹" : "🎤"}
                </button>
              )}

              {voiceSupported && (
                <div className="flex items-center justify-center flex-shrink-0">
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      autoSpeak
                        ? "bg-grab-green text-white shadow-md border-grab-green"
                        : "glass text-gray-700 hover:bg-grab-green "
                    }`}
                  >
                    <span className="text-lg">{autoSpeak ? "🔊" : "🔇"}</span>
                  </button>
                </div>
              )}
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-grab-green text-white rounded-lg hover:bg-[#009640] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base font-semibold shadow-md hover:shadow-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
