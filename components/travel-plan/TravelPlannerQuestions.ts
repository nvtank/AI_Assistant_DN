import { TravelPlanRequest } from '@/lib/types';

export interface Question {
  id: keyof TravelPlanRequest | 'welcome' | 'generating';
  question: string;
  type: 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'people' | 'budget';
  options?: { value: string; label: string; emoji?: string }[];
  validation?: (value: any) => boolean | string;
}

export const QUESTIONS: Question[] = [
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
    validation: (value: string) => true,
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

