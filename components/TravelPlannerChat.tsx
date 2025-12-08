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
    question: '👋 Xin chào! Tôi là trợ lý du lịch AI của bạn.\n\nTôi sẽ giúp bạn lên kế hoạch chi tiết cho chuyến đi Đà Nẵng. Hãy trả lời một vài câu hỏi để tôi có thể tạo lịch trình tốt nhất cho bạn nhé!',
    type: 'text',
  },
  {
    id: 'startDate',
    question: '📅 Bạn muốn bắt đầu chuyến đi vào ngày nào?\n\n(Ví dụ: 2025-12-20)',
    type: 'date',
    validation: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return 'Ngày bắt đầu phải từ hôm nay trở đi';
      return true;
    },
  },
  {
    id: 'endDate',
    question: '📅 Và kết thúc vào ngày nào?\n\n(Ví dụ: 2025-12-22)',
    type: 'date',
    validation: (value: string) => {
      return true; // Will validate against startDate
    },
  },
  {
    id: 'numberOfPeople',
    question: '👥 Chuyến đi này có bao nhiêu người?\n\nVui lòng cho biết số người lớn và trẻ em (nếu có)',
    type: 'people',
  },
  {
    id: 'budget',
    question: '💰 Ngân sách dự kiến cho chuyến đi là bao nhiêu?\n\n(Đơn vị: VNĐ, cho toàn bộ chuyến đi)',
    type: 'budget',
  },
  {
    id: 'travelStyle',
    question: '🎯 Phong cách du lịch bạn thích là gì?',
    type: 'select',
    options: [
      { value: 'relax', label: 'Thư giãn, nghỉ dưỡng', emoji: '🏖️' },
      { value: 'adventure', label: 'Phiêu lưu, khám phá', emoji: '🏃' },
      { value: 'family', label: 'Gia đình, vui chơi', emoji: '👨‍👩‍👧‍👦' },
      { value: 'couple', label: 'Lãng mạn, cặp đôi', emoji: '💑' },
      { value: 'cultural', label: 'Văn hóa, lịch sử', emoji: '🏛️' },
      { value: 'foodie', label: 'Ẩm thực, khám phá món ăn', emoji: '🍜' },
    ],
  },
  {
    id: 'transportation',
    question: '🚗 Bạn muốn di chuyển bằng phương tiện gì?',
    type: 'select',
    options: [
      { value: 'motorbike', label: 'Xe máy (tự do, linh hoạt)', emoji: '🏍️' },
      { value: 'car', label: 'Ô tô (thuê xe tự lái)', emoji: '🚗' },
      { value: 'taxi', label: 'Taxi (tiện lợi)', emoji: '🚕' },
      { value: 'grab', label: 'Grab (công nghệ)', emoji: '📱' },
      { value: 'mixed', label: 'Kết hợp nhiều loại', emoji: '🚦' },
    ],
  },
  {
    id: 'accommodation',
    question: '🏨 Bạn muốn ở loại chỗ nào?',
    type: 'select',
    options: [
      { value: 'hotel', label: 'Khách sạn (3-4 sao)', emoji: '🏨' },
      { value: 'resort', label: 'Resort (cao cấp)', emoji: '🏝️' },
      { value: 'homestay', label: 'Homestay (trải nghiệm địa phương)', emoji: '🏡' },
      { value: 'hostel', label: 'Hostel (tiết kiệm)', emoji: '🛏️' },
      { value: 'any', label: 'Không quan trọng', emoji: '✨' },
    ],
  },
  {
    id: 'timePreference',
    question: '⏰ Bạn thích khung giờ hoạt động như thế nào?',
    type: 'select',
    options: [
      { value: 'early', label: 'Dậy sớm (6-7h), về sớm (18h)', emoji: '🌅' },
      { value: 'normal', label: 'Bình thường (8-9h), về vừa (20h)', emoji: '☀️' },
      { value: 'late', label: 'Dậy muộn (10h), về muộn (22h)', emoji: '🌆' },
    ],
  },
  {
    id: 'foodPreferences',
    question: '🍜 Bạn thích ăn món gì?\n\n(Có thể chọn nhiều)',
    type: 'multiselect',
    options: [
      { value: 'seafood', label: 'Hải sản', emoji: '🦞' },
      { value: 'vietnamese', label: 'Món Việt truyền thống', emoji: '🍲' },
      { value: 'bbq', label: 'Nướng/BBQ', emoji: '🍖' },
      { value: 'vegetarian', label: 'Chay', emoji: '🥗' },
      { value: 'street-food', label: 'Ăn vặt đường phố', emoji: '🥟' },
      { value: 'international', label: 'Món quốc tế', emoji: '🍕' },
      { value: 'cafe', label: 'Cafe, đồ uống', emoji: '☕' },
    ],
  },
  {
    id: 'allergies',
    question: '⚠️ Bạn có dị ứng với món ăn hoặc hoạt động nào không?\n\n(Ví dụ: hải sản, sữa, độ cao...)\n\nNếu không có, gõ "Không"',
    type: 'text',
  },
  {
    id: 'restrictions',
    question: '🚫 Có điều gì bạn không muốn hoặc không thể làm không?\n\n(Ví dụ: không đi biển, không thích hoạt động mạo hiểm...)\n\nNếu không có, gõ "Không"',
    type: 'text',
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
        addMessage('assistant', `❌ ${validationResult}\n\nVui lòng thử lại.`);
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
        const items = value.toLowerCase() === 'không' ? [] : value.split(',').map((s: string) => s.trim());
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
          addMessage('assistant', '❌ Ngày kết thúc phải sau ngày bắt đầu!\n\nVui lòng thử lại.');
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
      return selected?.map((opt) => `${opt.emoji} ${opt.label}`).join(', ') || 'Không có';
    }
    if (question.type === 'people') {
      return `${planRequest.numberOfPeople?.adults} người lớn, ${planRequest.numberOfPeople?.children} trẻ em`;
    }
    if (question.type === 'budget') {
      return `${planRequest.budget?.min.toLocaleString()} - ${planRequest.budget?.max.toLocaleString()} VNĐ`;
    }
    return value;
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    addMessage('assistant', '🤖 Đang phân tích thông tin và tạo kế hoạch chi tiết cho bạn...\n\n⏳ Quá trình này có thể mất 20-30 giây. Vui lòng đợi nhé!');

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
        `✅ Kế hoạch của bạn đã sẵn sàng!\n\n📋 Tổng chi phí ước tính: ${data.plan.totalEstimatedCost.total.toLocaleString()} VNĐ\n\nBạn có thể xem chi tiết và chỉnh sửa kế hoạch bên dưới.`
      );
    } catch (error: any) {
      console.error('❌ Generate plan error:', error);
      const errorMessage = error.message || 'Unknown error';
      addMessage(
        'assistant', 
        `❌ Có lỗi xảy ra khi tạo kế hoạch:\n\n${errorMessage}\n\n` +
        `Debug info:\n` +
        `- User ID: ${user?.uid || 'guest'}\n` +
        `- Dates: ${planRequest.startDate} - ${planRequest.endDate}\n` +
        `- People: ${planRequest.numberOfPeople?.adults || 0} adults\n\n` +
        `Vui lòng kiểm tra:\n` +
        `1. API keys trong .env\n` +
        `2. Internet connection\n` +
        `3. Firebase setup\n\n` +
        `Hoặc thử lại sau.`
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
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Đăng nhập
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
              <p className="text-sm text-gray-600">Lên kế hoạch du lịch Đà Nẵng</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Bước {currentStep}/{QUESTIONS.length - 1}
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
                  <span>Đang tạo kế hoạch...</span>
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
              📋 Xem kế hoạch chi tiết →
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
                placeholder="Nhập câu trả lời..."
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
              {currentStep === 0 ? 'Bắt đầu' : currentStep === QUESTIONS.length - 1 ? 'Tạo kế hoạch' : 'Tiếp tục'}
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
        <span className="font-medium">👨 Người lớn</span>
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
        <span className="font-medium">👶 Trẻ em</span>
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
  const presets = [
    { label: '2-3 triệu', min: 2000000, max: 3000000 },
    { label: '3-5 triệu', min: 3000000, max: 5000000 },
    { label: '5-7 triệu', min: 5000000, max: 7000000 },
    { label: '7-10 triệu', min: 7000000, max: 10000000 },
    { label: 'Trên 10 triệu', min: 10000000, max: 20000000 },
  ];

  return (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.min, preset.max)}
            className={`p-3 rounded-xl border-2 transition-all ${
              min === preset.min && max === preset.max
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="text-sm text-gray-600 mb-2">Hoặc tùy chỉnh:</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Tối thiểu (VNĐ)</label>
            <input
              type="number"
              value={min}
              onChange={(e) => onChange(parseInt(e.target.value) || 0, max)}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              step="100000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Tối đa (VNĐ)</label>
            <input
              type="number"
              value={max}
              onChange={(e) => onChange(min, parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              step="100000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
