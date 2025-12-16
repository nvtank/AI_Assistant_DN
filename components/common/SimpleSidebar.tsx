'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeatherData, DA_NANG_CENTER, ChatConversation, TravelPlan } from '@/lib/types';
import UserMenu from './UserMenu';
import { logOut } from '@/lib/authService';
import { 
  getUserConversations, 
  getUserTravelPlans,
  deleteChatConversation,
  deleteTravelPlan,
  updateChatConversation,
} from '@/lib/travelPlanService';
import { formatTimestamp } from '@/lib/utils';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  conversation: ChatConversation;
}

interface SimpleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
  connectedUsers?: number;
}

type SidebarTab = 'chat' | 'plans';

export default function SimpleSidebar({ isOpen, onToggle, user }: SimpleSidebarProps) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [plannerConversations, setPlannerConversations] = useState<ChatHistory[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingAllPlanner, setDeletingAllPlanner] = useState(false);
  
  useEffect(() => {
    const fetchSidebarWeather = async () => {
      try {
        const response = await fetch(`/api/weather?lat=${DA_NANG_CENTER.lat}&lon=${DA_NANG_CENTER.lng}`);
        const data = await response.json();
        
        if (data.temp !== undefined) {
          setWeather({
            temp: data.temp,
            feels_like: data.feels_like,
            humidity: data.humidity,
            description: data.description,
            main: data.main,
            wind_speed: data.windSpeed,
          });
        }
      } catch (error) {
        console.error('Error fetching weather for sidebar:', error);
      }
    };
    
    fetchSidebarWeather();
  }, []);

  // Load chat history from Firebase
  useEffect(() => {
    if (!user || !isOpen) {
      console.log('⚠️ Sidebar: Not loading chat history - user:', !!user, 'isOpen:', isOpen);
      return;
    }

    const loadChatHistory = async () => {
      try {
        console.log('🔄 Sidebar: Loading chat history for user:', user.uid);
        setLoadingChat(true);
        const conversations = await getUserConversations(user.uid);
        console.log('📦 Sidebar: Received conversations:', conversations.length, conversations);
        
        // Filter conversations by type: only show normal chat conversations in chat tab
        const normalConversations = conversations.filter(conv => !conv.type || conv.type === 'normal');
        
        const history: ChatHistory[] = normalConversations.map((conv) => {
          // Get first user message as title
          const firstUserMessage = conv.messages?.find((msg: any) => msg.role === 'user');
          const title = firstUserMessage?.content?.substring(0, 40) || 'New conversation';
          
          // Format timestamp
          let timestamp = 'N/A';
          try {
            if (conv.updatedAt) {
              timestamp = conv.updatedAt?.toDate 
                ? formatTimestamp(conv.updatedAt)
                : formatTimestamp(conv.updatedAt);
            }
          } catch (e) {
            console.warn('Error formatting timestamp:', e);
          }
          
          return {
            id: conv.id || '',
            title: title.length > 40 ? title + '...' : title,
            timestamp,
            conversation: conv,
          };
        });
        
        console.log('✅ Sidebar: Processed chat history:', history);
        setChatHistory(history);
        console.log('✅ Sidebar: Loaded chat history:', history.length, 'items');
      } catch (error) {
        console.error('❌ Sidebar: Error loading chat history:', error);
        // Show error in UI
        setChatHistory([]);
      } finally {
        setLoadingChat(false);
      }
    };

    if (activeTab === 'chat') {
      console.log('🔄 Sidebar: Active tab is chat, loading history...');
      loadChatHistory();
    } else {
      console.log('⚠️ Sidebar: Active tab is not chat:', activeTab);
    }
  }, [user, isOpen, activeTab]);

  // Load travel plans and planner conversations from Firebase
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadTravelPlans = async () => {
      try {
        setLoadingPlans(true);
        const plans = await getUserTravelPlans(user.uid);
        setTravelPlans(plans);
        console.log('✅ Loaded travel plans:', plans.length);
      } catch (error) {
        console.error('❌ Error loading travel plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadPlannerConversations = async () => {
      try {
        setLoadingPlans(true);
        const conversations = await getUserConversations(user.uid);
        // Filter only planner conversations
        const plannerConvs = conversations.filter(conv => conv.type === 'planner');
        
        // Format planner conversations
        const plannerHistory: ChatHistory[] = plannerConvs.map((conv) => {
          // Try to get a better title from plan request or messages
          let title = 'Travel Planning';
          
          // If has travel plan, try to get info from plan request
          if (conv.planRequest?.startDate && conv.planRequest?.endDate) {
            const startDate = new Date(conv.planRequest.startDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
            const endDate = new Date(conv.planRequest.endDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
            title = `${startDate} - ${endDate}`;
          } else {
            // Fallback to first user message
            const firstUserMessage = conv.messages?.find((msg: any) => msg.role === 'user');
            if (firstUserMessage?.content) {
              title = firstUserMessage.content.substring(0, 40);
            }
          }
          
          let timestamp = 'N/A';
          try {
            if (conv.updatedAt) {
              timestamp = conv.updatedAt?.toDate 
                ? formatTimestamp(conv.updatedAt.toDate())
                : formatTimestamp(conv.updatedAt);
            }
          } catch (e) {
            console.warn('Error formatting timestamp:', e);
          }
          
          return {
            id: conv.id || '',
            title: title.length > 40 ? title + '...' : title,
            timestamp,
            conversation: conv,
          };
        });
        setPlannerConversations(plannerHistory);
        
        // Also get travel plans
        const plans = await getUserTravelPlans(user.uid);
        setTravelPlans(plans);
        console.log('✅ Loaded travel plans:', plans.length);
        console.log('✅ Loaded planner conversations:', plannerHistory.length);
      } catch (error) {
        console.error('❌ Error loading travel plans/conversations:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    if (activeTab === 'plans') {
      loadPlannerConversations();
    }
  }, [user, isOpen, activeTab]);

  // Delete chat conversation
  const handleDeleteChat = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading conversation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      setDeletingId(conversationId);
      await deleteChatConversation(conversationId);
      // Remove from local state
      setChatHistory(prev => prev.filter(chat => chat.id !== conversationId));
      console.log('✅ Deleted conversation:', conversationId);
      
      // Dispatch event to notify AIChatbot if current conversation was deleted
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chatConversationDeleted', { 
          detail: { conversationId } 
        }));
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete all chat conversations
  const handleDeleteAllChats = async () => {
    if (chatHistory.length === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete all ${chatHistory.length} conversations?\n\nThis action cannot be undone!`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingAll(true);
      const allConversationIds = chatHistory.map(chat => chat.id);
      
      // Delete all conversations
      for (const conversationId of allConversationIds) {
        try {
          await deleteChatConversation(conversationId);
          console.log('✅ Deleted conversation:', conversationId);
        } catch (error) {
          console.error(`❌ Error deleting conversation ${conversationId}:`, error);
        }
      }
      
      // Clear local state
      setChatHistory([]);
      console.log('✅ Deleted all conversations');
      
      // Dispatch event to notify AIChatbot to reset
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chatConversationDeleted', { 
          detail: { conversationId: 'all' } 
        }));
      }
    } catch (error) {
      console.error('❌ Error deleting all conversations:', error);
      alert('Failed to delete all conversations. Please try again.');
    } finally {
      setDeletingAll(false);
    }
  };

  // Delete all planner conversations
  const handleDeleteAllPlannerConversations = async () => {
    if (plannerConversations.length === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete all ${plannerConversations.length} planning sessions?\n\nThis action cannot be undone!`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingAllPlanner(true);
      const allConversationIds = plannerConversations.map(conv => conv.id);
      
      // Delete all planner conversations
      for (const conversationId of allConversationIds) {
        try {
          await deleteChatConversation(conversationId);
          console.log('✅ Deleted planner conversation:', conversationId);
        } catch (error) {
          console.error(`❌ Error deleting planner conversation ${conversationId}:`, error);
        }
      }
      
      // Clear local state
      setPlannerConversations([]);
      console.log('✅ Deleted all planner conversations');
      
      // Dispatch event to notify TravelPlannerChat to reset
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('plannerConversationDeleted', { 
          detail: { conversationId: 'all' } 
        }));
      }
    } catch (error) {
      console.error('❌ Error deleting all planner conversations:', error);
      alert('Failed to delete all planning sessions. Please try again.');
    } finally {
      setDeletingAllPlanner(false);
    }
  };

  // Delete travel plan
  const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      setDeletingId(planId);
      await deleteTravelPlan(planId);
      // Remove from local state
      setTravelPlans(prev => prev.filter(plan => plan.id !== planId));
      console.log('✅ Deleted travel plan:', planId);
    } catch (error) {
      console.error('❌ Error deleting travel plan:', error);
      alert('Failed to delete plan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      <aside className={`
        h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col 
        fixed left-0 top-0 z-50 shadow-lg
        ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
      `}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200">
          {isOpen && <span className="font-bold text-3xl text-grab-green tracking-tight">Findly</span>}
          <button 
            onClick={onToggle} 
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors ml-auto"
          >
            {isOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

      {/* Weather & Online Status */}
      {isOpen ? (
        <div className="p-3 space-y-2 border-b border-gray-200">
          {weather && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200/50">
              <span className="text-xl">🌡️</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{Math.round(weather.temp)}°C</p>
                <p className="text-xs text-gray-600 capitalize">{weather.description}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 border-b border-gray-200">
          {weather && (
            <div className="text-center" title={`${Math.round(weather.temp)}°C - ${weather.description}`}>
              <span className="text-xl">🌡️</span>
              <p className="text-[10px] font-bold text-gray-700">{Math.round(weather.temp)}°</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {isOpen && (
        <div className="border-b border-gray-200 px-2 pt-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-grab-green shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                activeTab === 'plans'
                  ? 'bg-white text-grab-green shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✈️ Plans
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'chat' ? (
            <>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={async () => {
                    // Save current conversation and reset
                    if (typeof window !== 'undefined') {
                      // Dispatch event to save and reset chat
                      window.dispatchEvent(new CustomEvent('newChatRequested'));
                      // Clear session storage
                      sessionStorage.removeItem('loadConversationId');
                    }
                  }}
                  className="group relative flex-1 bg-grab-green text-white py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg hover:bg-[#009640] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Chat</span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>
                <button
                  onClick={() => {
                    // Force reload chat history
                    if (user) {
                      const loadChatHistory = async () => {
                        try {
                          setLoadingChat(true);
                          const conversations = await getUserConversations(user.uid);
                          const history: ChatHistory[] = conversations.map((conv) => {
                            const firstUserMessage = conv.messages?.find((msg: any) => msg.role === 'user');
                            const title = firstUserMessage?.content?.substring(0, 40) || 'New conversation';
                            let timestamp = 'N/A';
                            try {
                              if (conv.updatedAt) {
                                timestamp = conv.updatedAt?.toDate 
                                  ? formatTimestamp(conv.updatedAt)
                                  : formatTimestamp(conv.updatedAt);
                              }
                            } catch (e) {
                              console.warn('Error formatting timestamp:', e);
                            }
                            return {
                              id: conv.id || '',
                              title: title.length > 40 ? title + '...' : title,
                              timestamp,
                              conversation: conv,
                            };
                          });
                          setChatHistory(history);
                          console.log('✅ Refreshed chat history:', history.length);
                        } catch (error) {
                          console.error('❌ Error refreshing chat history:', error);
                        } finally {
                          setLoadingChat(false);
                        }
                      };
                      loadChatHistory();
                    }
                  }}
                  disabled={loadingChat}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-50"
                  title="Refresh chat history"
                >
                  <svg className={`w-4 h-4 ${loadingChat ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {loadingChat ? 'Loading...' : `Recent (${chatHistory.length})`}
                  </p>
                  {chatHistory.length > 0 && (
                    <button
                      onClick={handleDeleteAllChats}
                      disabled={deletingAll || loadingChat}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Delete all conversations"
                    >
                      {deletingAll ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete All</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                {loadingChat ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-grab-green"></div>
                    <p className="mt-2">Loading chat history...</p>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <p>No chat history yet</p>
                    <p className="text-xs mt-1 text-gray-300">Start chatting to see history here</p>
                  </div>
                ) : (
                  chatHistory.map(chat => {
                    console.log('Rendering chat item:', chat);
                    return (
                    <div
                      key={chat.id}
                      className="group relative w-full"
                    >
                      <button 
                        onClick={() => {
                          // Store conversation ID in sessionStorage to load in chat
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('loadConversationId', chat.id);
                            // Trigger a custom event to reload chat
                            window.dispatchEvent(new Event('loadConversation'));
                          }
                        }}
                        className="w-full text-left px-3 py-2.5 pr-10 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200"
                      >
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-grab-green">{chat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{chat.timestamp}</p>
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        disabled={deletingId === chat.id}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="Delete conversation"
                      >
                        {deletingId === chat.id ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={async () => {
                    // Save current planner conversation and reset
                    if (typeof window !== 'undefined') {
                      // Dispatch event to save and reset planner
                      window.dispatchEvent(new CustomEvent('newPlanRequested'));
                      // Set flag to switch to planner mode
                      sessionStorage.setItem('switchToPlannerMode', 'true');
                      // Navigate to home
                      router.push('/');
                    }
                  }}
                  className="group relative flex-1 bg-grab-green text-white py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg hover:bg-[#009640] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Plan</span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Restart button clicked');
                    // Clear any conversation ID
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('loadPlannerConversationId');
                      sessionStorage.removeItem('restartPlannerConversationId');
                      // Set flag to switch to planner mode and restart
                      sessionStorage.setItem('switchToPlannerAndRestart', 'true');
                      // Navigate to home page (will trigger mode switch)
                      router.push('/');
                    }
                  }}
                  className="px-3 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  title="Restart Planning"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {/* Planner Conversations */}
                {plannerConversations.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-2 mb-2 mt-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Planning Sessions ({plannerConversations.length})
                      </p>
                      <button
                        onClick={handleDeleteAllPlannerConversations}
                        disabled={deletingAllPlanner || loadingPlans}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Delete all planning sessions"
                      >
                        {deletingAllPlanner ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete All</span>
                          </>
                        )}
                      </button>
                    </div>
                    {plannerConversations.map(conv => (
                      <div
                        key={conv.id}
                        className="group relative w-full mb-2"
                      >
                        <button 
                          onClick={async () => {
                            console.log('🔍 Clicked planner conversation:', conv.id);
                            console.log('📋 Conversation data:', conv.conversation);
                            
                            // If conversation has a travel plan ID, navigate directly to it
                            const travelPlanId = conv.conversation?.travelPlanId;
                            const completed = conv.conversation?.completed;
                            
                            console.log('📋 Travel Plan ID:', travelPlanId);
                            console.log('✅ Completed:', completed);
                            
                            if (travelPlanId) {
                              console.log('📋 Navigating to travel plan:', travelPlanId);
                              router.push(`/travel-plan/${travelPlanId}`);
                              return;
                            }
                            
                            // Otherwise, load conversation in planner
                            if (typeof window !== 'undefined') {
                              sessionStorage.setItem('loadPlannerConversationId', conv.id);
                              // Set flag to switch to planner mode
                              sessionStorage.setItem('switchToPlannerMode', 'true');
                              // Navigate to home
                              router.push('/');
                            }
                          }}
                          className="w-full text-left px-3 py-2.5 pr-20 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 bg-blue-50/50"
                        >
                          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-grab-green">
                            {conv.conversation?.completed && conv.conversation?.travelPlanId ? '✅' : '📋'} {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{conv.timestamp}</p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to restart this planning session? All current progress will be deleted.')) {
                              // Restart this specific conversation
                              if (typeof window !== 'undefined') {
                                sessionStorage.setItem('restartPlannerConversationId', conv.id);
                                sessionStorage.setItem('switchToPlannerAndRestart', 'true');
                                router.push('/');
                              }
                            }
                          }}
                          className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-orange-100 text-gray-400 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all"
                          title="Restart planning session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Are you sure you want to delete this planning session?')) {
                              return;
                            }

                            try {
                              setDeletingId(conv.id);
                              await deleteChatConversation(conv.id);
                              // Remove from local state
                              setPlannerConversations(prev => prev.filter(c => c.id !== conv.id));
                              console.log('✅ Deleted planner conversation:', conv.id);
                              
                              // Dispatch event to notify TravelPlannerChat
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('plannerConversationDeleted', { 
                                  detail: { conversationId: conv.id } 
                                }));
                              }
                            } catch (error) {
                              console.error('❌ Error deleting planner conversation:', error);
                              alert('Failed to delete planning session. Please try again.');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === conv.id}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === conv.id ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Travel Plans */}
                <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2 tracking-wider mt-4">
                  {loadingPlans ? 'Loading...' : `Completed Plans (${travelPlans.length})`}
                </p>
                {loadingPlans ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-grab-green"></div>
                    <p className="mt-2">Loading...</p>
                  </div>
                ) : travelPlans.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <p>No travel plans yet</p>
                    <p className="text-xs mt-1 text-gray-300">Create a plan to see it here</p>
                  </div>
                ) : (
                  <>
                    {travelPlans.map(plan => {
                      const startDate = plan.request?.startDate 
                        ? new Date(plan.request.startDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                        : 'N/A';
                      const endDate = plan.request?.endDate
                        ? new Date(plan.request.endDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                        : '';
                      const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;
                      
                      return (
                        <div
                          key={plan.id}
                          className="group relative w-full"
                        >
                          <button 
                            onClick={() => router.push(`/travel-plan/${plan.id}`)}
                            className="w-full text-left px-3 py-2.5 pr-10 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200"
                          >
                            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-grab-green">
                              {plan.days?.length || 0} days • {dateRange}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">{plan.status}</p>
                          </button>
                          <button
                            onClick={(e) => handleDeletePlan(plan.id || '', e)}
                            disabled={deletingId === plan.id || !plan.id}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                            title="Delete plan"
                          >
                            {deletingId === plan.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* User Menu */}
      <div className="border-t border-gray-200 p-3 relative mt-auto">
        {isOpen ? (
          <>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="bg-grab-green rounded-full p-0.5 shadow-sm">
                <UserMenu showText={false} isSidebarOpen={isOpen} inSidebar={true} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)}></div>
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex justify-center">
            <div className="bg-grab-green rounded-full p-1 shadow-sm">
              <UserMenu showText={false} isSidebarOpen={isOpen} inSidebar={true} />
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

