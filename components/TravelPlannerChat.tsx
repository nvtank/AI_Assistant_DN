'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { TravelPlanRequest, ChatMessage, TravelPlan } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface Question {
  id: keyof TravelPlanRequest | 'welcome' | 'generating';
  question: string;
  type: 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'people' | 'budget';
  options?: { value: string; label: string; emoji?: string }[];
  validation?: (value: any) => boolean | string;
}

const QUESTIONS: Question[] = [
  {
    id: 'welcome',
    question: '👋 Hello! I\'m your AI Travel Assistant.\n\nI\'ll help you plan a detailed trip to Da Nang. Please answer a few questions so I can create the best itinerary for you!',
    type: 'text',
  },
  {
    id: 'startDate',
    question: '📅 When would you like to start your trip?\n\n(Example: 2025-12-20)',
    type: 'date',
    validation: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return 'Start date must be today or later';
      return true;
    },
  },
  {
    id: 'endDate',
    question: '📅 And when will it end?\n\n(Example: 2025-12-22)',
    type: 'date',
    validation: (value: string) => {
      return true; // Will validate against startDate
    },
  },
  {
    id: 'numberOfPeople',
    question: '👥 How many people are going on this trip?\n\nPlease specify number of adults and children (if any)',
    type: 'people',
  },
  {
    id: 'budget',
    question: '💰 What is your total budget for the entire trip?\n\n(This will be allocated for transportation, food, activities, and contingencies)',
    type: 'budget',
    options: [
      { value: '4000000', label: '4 million VND', emoji: '💵' },
      { value: '10000000', label: '10 million VND', emoji: '💰' },
      { value: '20000000', label: '20 million VND', emoji: '💎' },
      { value: 'custom', label: 'Custom amount', emoji: '✏️' },
    ],
  },
  {
    id: 'travelStyle',
    question: '🎯 What\'s your preferred travel style?',
    type: 'select',
    options: [
      { value: 'relax', label: 'Relaxation & Resort', emoji: '🏖️' },
      { value: 'adventure', label: 'Adventure & Exploration', emoji: '🏃' },
      { value: 'family', label: 'Family Fun', emoji: '👨‍👩‍👧‍👦' },
      { value: 'couple', label: 'Romantic Getaway', emoji: '💑' },
      { value: 'cultural', label: 'Culture & History', emoji: '🏛️' },
      { value: 'foodie', label: 'Food & Culinary', emoji: '🍜' },
    ],
  },
  {
    id: 'transportation',
    question: '🚗 How would you like to get around?',
    type: 'select',
    options: [
      { value: 'motorbike', label: 'Motorbike (flexible)', emoji: '🏍️' },
      { value: 'car', label: 'Car (self-drive rental)', emoji: '🚗' },
      { value: 'taxi', label: 'Taxi (convenient)', emoji: '🚕' },
      { value: 'grab', label: 'Grab (ride-hailing)', emoji: '📱' },
      { value: 'mixed', label: 'Mixed transport', emoji: '🚦' },
    ],
  },
  {
    id: 'accommodation',
    question: '🏨 What type of accommodation do you prefer?',
    type: 'select',
    options: [
      { value: 'hotel', label: 'Hotel (3-4 star)', emoji: '🏨' },
      { value: 'resort', label: 'Resort (luxury)', emoji: '🏝️' },
      { value: 'homestay', label: 'Homestay (local experience)', emoji: '🏡' },
      { value: 'hostel', label: 'Hostel (budget)', emoji: '🛏️' },
      { value: 'any', label: 'No preference', emoji: '✨' },
    ],
  },
  {
    id: 'timePreference',
    question: '⏰ What is your daily activity timeframe?',
    type: 'select',
    options: [
      { value: 'early', label: 'Early morning → Afternoon', emoji: '🌅' },
      { value: 'normal', label: 'Normal hours', emoji: '☀️' },
      { value: 'late', label: 'Afternoon → Late night', emoji: '🌆' },
    ],
  },
  {
    id: 'foodPreferences',
    question: '🍜 What types of food do you enjoy?\n\n(You can select multiple)',
    type: 'multiselect',
    options: [
      { value: 'seafood', label: 'Seafood', emoji: '🦞' },
      { value: 'vietnamese', label: 'Traditional Vietnamese', emoji: '🍲' },
      { value: 'bbq', label: 'BBQ/Grilled', emoji: '🍖' },
      { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
      { value: 'street-food', label: 'Street food', emoji: '🥟' },
      { value: 'international', label: 'International cuisine', emoji: '🍕' },
      { value: 'cafe', label: 'Cafes & Drinks', emoji: '☕' },
    ],
  },
  {
    id: 'allergies',
    question: '⚠️ Do you have any food or activity allergies?\n\n(Example: seafood, dairy, heights...)\n\nIf none, type "None"',
    type: 'text',
  },
  {
    id: 'restrictions',
    question: '🚫 Is there anything you don\'t want to do or can\'t do?\n\n(Example: no beach, no extreme activities...)\n\nIf none, type "None"',
    type: 'text',
  },
  {
    id: 'specialRequirements',
    question: '❤️ **Please tell me about your preferences & special notes** (REQUIRED)\n\nFor example:\n• Travel interests (food, photography, relaxation, exploration, nature, city tour...)\n• Special considerations:\n  - Budget conscious / comfortable spending\n  - Avoid crowds\n  - Fear of heights\n  - Don\'t like walking much\n  - Traveling with children / elderly\n  - Any other special requests\n\n✨ The more details you provide, the better I can customize your perfect itinerary!',
    type: 'text',
    validation: (value: string) => {
      if (!value || value.trim().length < 10) {
        return 'Please provide at least a brief description of your preferences (min 10 characters)';
      }
      return true;
    },
  },
];

export default function TravelPlannerChat() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [planRequest, setPlanRequest] = useState<Partial<TravelPlanRequest>>({
    numberOfPeople: { adults: 1, children: 0 },
    budget: { min: 1000000, max: 5000000, currency: 'VND' },
    foodPreferences: [],
    allergies: [],
    restrictions: [],
    timePreference: { morningStart: 'normal', eveningEnd: 'normal' },
  });
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<TravelPlan | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    // Show welcome message
    if (messages.length === 0) {
      addMessage('assistant', QUESTIONS[0].question);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Welcome message
      addMessage('user', 'Bắt đầu nào!');
      setCurrentStep(1);
      setTimeout(() => {
        addMessage('assistant', QUESTIONS[1].question);
      }, 500);
      return;
    }

    const currentQuestion = QUESTIONS[currentStep];
    let value: any = input;

    // Validate
    if (currentQuestion.validation) {
      const validationResult = currentQuestion.validation(value);
      if (validationResult !== true) {
        addMessage('assistant', `❌ ${validationResult}\n\nPlease try again.`);
        return;
      }
    }

    // Process answer based on type
    if (currentQuestion.type === 'people') {
      // Already handled by PeopleInput
    } else if (currentQuestion.type === 'budget') {
      // Already handled by BudgetInput
    } else if (currentQuestion.type === 'multiselect') {
      value = selectedOptions;
      setPlanRequest((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    } else if (currentQuestion.type === 'select') {
      const selected = currentQuestion.options?.find((opt) => opt.value === value);
      if (currentQuestion.id === 'timePreference') {
        setPlanRequest((prev) => ({
          ...prev,
          timePreference: {
            morningStart: value,
            eveningEnd: value,
          },
        }));
      } else {
        setPlanRequest((prev) => ({
          ...prev,
          [currentQuestion.id]: value,
        }));
      }
    } else if (currentQuestion.type === 'text') {
      if (currentQuestion.id === 'allergies' || currentQuestion.id === 'restrictions') {
        const items = value.toLowerCase() === 'none' || value.toLowerCase() === 'không' ? [] : value.split(',').map((s: string) => s.trim());
        setPlanRequest((prev) => ({
          ...prev,
          [currentQuestion.id]: items,
        }));
      }
    } else {
      // Validate endDate
      if (currentQuestion.id === 'endDate' && planRequest.startDate) {
        const startDate = new Date(planRequest.startDate);
        const endDate = new Date(value);
        if (endDate < startDate) {
          addMessage('assistant', '❌ End date must be after start date!\n\nPlease try again.');
          return;
        }
      }

      setPlanRequest((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    }

    // Add user message
    addMessage('user', formatAnswer(currentQuestion, value));

    // Clear input
    setInput('');
    setSelectedOptions([]);

    // Move to next question
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => {
        addMessage('assistant', QUESTIONS[currentStep + 1].question);
      }, 500);
    } else {
      // All questions answered, generate plan
      setTimeout(() => {
        generatePlan();
      }, 500);
    }
  };

  const formatAnswer = (question: Question, value: any): string => {
    if (question.type === 'select') {
      const option = question.options?.find((opt) => opt.value === value);
      return option ? `${option.emoji} ${option.label}` : value;
    }
    if (question.type === 'multiselect') {
      const selected = question.options?.filter((opt) => value.includes(opt.value));
      return selected?.map((opt) => `${opt.emoji} ${opt.label}`).join(', ') || 'None';
    }
    if (question.type === 'people') {
      return `${planRequest.numberOfPeople?.adults} adults, ${planRequest.numberOfPeople?.children} children`;
    }
    if (question.type === 'budget') {
      return `${planRequest.budget?.min.toLocaleString()} - ${planRequest.budget?.max.toLocaleString()} VND`;
    }
    return value;
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    addMessage('assistant', '🤖 Analyzing information and creating detailed plan for you...\n\n⏳ This may take 20-30 seconds. Please wait!');

    try {
      console.log('📤 Sending request with:', {
        planRequest,
        userId: user?.uid || 'guest',
      });

      const response = await fetch('/api/travel-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planRequest: planRequest as TravelPlanRequest,
          userId: user?.uid || 'guest',
        }),
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to generate plan';
        console.error('❌ API Error:', errorMsg);
        throw new Error(errorMsg);
      }

      setGeneratedPlan(data.plan);
      addMessage(
        'assistant',
        `✅ Your plan is ready!\n\n📋 Total estimated cost: ${data.plan.totalEstimatedCost.total.toLocaleString()} VND\n\nYou can view details and edit your plan below.`
      );
    } catch (error: any) {
      console.error('❌ Generate plan error:', error);
      const errorMessage = error.message || 'Unknown error';
      addMessage(
        'assistant', 
        `❌ Error generating plan:\n\n${errorMessage}\n\n` +
        `Debug info:\n` +
        `- User ID: ${user?.uid || 'guest'}\n` +
        `- Dates: ${planRequest.startDate} - ${planRequest.endDate}\n` +
        `- People: ${planRequest.numberOfPeople?.adults || 0} adults\n\n` +
        `Please check:\n` +
        `1. API keys in .env\n` +
        `2. Internet connection\n` +
        `3. Firebase setup\n\n` +
        `Or try again later.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (value: string) => {
    const currentQuestion = QUESTIONS[currentStep];
    if (currentQuestion.type === 'multiselect') {
      setSelectedOptions((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setInput(value);
    }
  };

  const handlePeopleChange = (adults: number, children: number) => {
    setPlanRequest((prev) => ({
      ...prev,
      numberOfPeople: { adults, children },
    }));
  };

  const handleBudgetChange = (min: number, max: number) => {
    setPlanRequest((prev) => ({
      ...prev,
      budget: { min, max, currency: 'VND' },
    }));
  };

  const currentQuestion = QUESTIONS[currentStep];
  const canProceed =
    currentStep === 0 ||
    (currentQuestion.type === 'text' && input.trim()) ||
    (currentQuestion.type === 'date' && input) ||
    (currentQuestion.type === 'select' && input) ||
    (currentQuestion.type === 'multiselect' && selectedOptions.length > 0) ||
    currentQuestion.type === 'people' ||
    currentQuestion.type === 'budget';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please login</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">🗺️ AI Travel Planner</h1>
              <p className="text-sm text-gray-600">Plan your Da Nang trip</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Step {currentStep}/{QUESTIONS.length - 1}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-3xl space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 shadow-md rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span>Generating plan...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Generated Plan Preview */}
      {generatedPlan && (
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="container mx-auto max-w-3xl">
            <button
              onClick={() => router.push(`/travel-plan/${generatedPlan.id}`)}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              📋 View Detailed Plan →
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!isGenerating && !generatedPlan && (
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="container mx-auto max-w-3xl">
            {currentQuestion.type === 'select' && currentQuestion.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      input === option.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl mr-2">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiselect' && currentQuestion.options && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedOptions.includes(option.value)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <span className="text-xl mr-2">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'people' && (
              <PeopleInput
                adults={planRequest.numberOfPeople?.adults || 1}
                children={planRequest.numberOfPeople?.children || 0}
                onChange={handlePeopleChange}
              />
            )}

            {currentQuestion.type === 'budget' && (
              <BudgetInput
                min={planRequest.budget?.min || 1000000}
                max={planRequest.budget?.max || 5000000}
                onChange={handleBudgetChange}
              />
            )}

            {(currentQuestion.type === 'text' || currentQuestion.type === 'date') && (
              <input
                type={currentQuestion.type === 'date' ? 'date' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                placeholder="Enter your answer..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none mb-4"
                autoFocus
              />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                canProceed
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 0 ? 'Start' : currentStep === QUESTIONS.length - 1 ? 'Generate Plan' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function PeopleInput({
  adults,
  children,
  onChange,
}: {
  adults: number;
  children: number;
  onChange: (adults: number, children: number) => void;
}) {
  return (
    <div className="space-y-4 mb-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <span className="font-medium">👨 Adults</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(Math.max(1, adults - 1), children)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-8 text-center font-bold">{adults}</span>
          <button
            onClick={() => onChange(adults + 1, children)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <span className="font-medium">👶 Children</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(adults, Math.max(0, children - 1))}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-8 text-center font-bold">{children}</span>
          <button
            onClick={() => onChange(adults, children + 1)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetInput({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  
  const presets = [
    { label: '💵 4 million VND', emoji: '💵', amount: 4000000 },
    { label: '💰 10 million VND', emoji: '💰', amount: 10000000 },
    { label: '💎 20 million VND', emoji: '💎', amount: 20000000 },
  ];
  
  const handlePresetClick = (amount: number) => {
    onChange(amount, amount);
    setShowCustom(false);
  };
  
  const handleCustomClick = () => {
    setShowCustom(true);
  };
  
  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0) {
      onChange(amount, amount);
    }
  };

  return (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.amount)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              min === preset.amount && max === preset.amount
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300 hover:shadow-md'
            }`}
          >
            <div className="text-2xl mb-2">{preset.emoji}</div>
            <div className="font-semibold text-sm">{preset.label}</div>
          </button>
        ))}
        
        {/* Custom amount button */}
        <button
          onClick={handleCustomClick}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            showCustom
              ? 'border-green-600 bg-green-50'
              : 'border-gray-200 hover:border-green-300 hover:shadow-md'
          }`}
        >
          <div className="text-2xl mb-2">✏️</div>
          <div className="font-semibold text-sm">Custom amount</div>
        </button>
      </div>
      
      {showCustom && (
        <div className="p-4 bg-gray-50 rounded-xl border-2 border-green-600">
          <div className="text-sm font-semibold text-gray-700 mb-2">💭 Enter your budget:</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g., 15000000"
              className="flex-1 p-3 border border-gray-300 rounded-lg"
              step="1000000"
              autoFocus
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customAmount || parseInt(customAmount) <= 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
