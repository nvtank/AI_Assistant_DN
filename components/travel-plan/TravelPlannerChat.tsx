'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { TravelPlanRequest, ChatMessage, TravelPlan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { QUESTIONS, Question } from './TravelPlannerQuestions';
import PeopleInput from './PeopleInput';
import BudgetInput from './BudgetInput';

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
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50/30">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div
                className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-grab-green text-white shadow-lg rounded-br-sm'
                    : 'glass text-gray-900 shadow-md border border-white/30 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start animate-fadeIn">
              <div className="glass p-4 rounded-2xl shadow-md border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-grab-green border-t-transparent"></div>
                  <span className="text-gray-700 font-medium">Generating your perfect plan...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Generated Plan Preview */}
      {generatedPlan && (
        <div className="border-t border-white/30 glass p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.push(`/travel-plan/${generatedPlan.id}`)}
              className="w-full bg-grab-green text-white py-4 rounded-xl font-semibold hover:bg-[#009640] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>📋</span>
              <span>View Detailed Plan</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!isGenerating && !generatedPlan && (
        <div className="border-t border-white/30 glass p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {currentQuestion.type === 'select' && currentQuestion.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      input === option.value
                        ? 'border-grab-green bg-grab-green/10 shadow-md'
                        : 'glass border-white/30 hover:border-grab-green/50 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-2xl mr-2">{option.emoji}</span>
                    <span className="font-medium text-gray-800">{option.label}</span>
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
                        ? 'border-grab-green bg-grab-green/10 shadow-md'
                        : 'glass border-white/30 hover:border-grab-green/50 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-xl mr-2">{option.emoji}</span>
                    <span className="text-sm font-medium text-gray-800">{option.label}</span>
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

            {(currentQuestion.type === 'text' || currentQuestion.type === 'date') && currentStep !== 0 && (
              <input
                type={currentQuestion.type === 'date' ? 'date' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                placeholder="Enter your answer..."
                className="w-full p-4 glass border-2 border-white/30 rounded-xl focus:border-grab-green focus:outline-none focus:ring-2 focus:ring-grab-green/20 mb-4 text-gray-800"
                autoFocus
              />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`group relative w-full py-4 rounded-lg font-semibold transition-all duration-200 overflow-hidden ${
                canProceed
                  ? 'bg-grab-green text-white hover:bg-[#009640] shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {currentStep === 0 ? (
                  <>
                    <span>Get Started</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : currentStep === QUESTIONS.length - 1 ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Plan</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              {canProceed && (
                <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

