'use client';

import React, { useState } from 'react';

interface BudgetInputProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export default function BudgetInput({ min, max, onChange }: BudgetInputProps) {
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
  
  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0) {
      onChange(amount, amount);
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.amount)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              min === preset.amount && max === preset.amount
                ? 'border-grab-green bg-grab-green/10 shadow-md'
                : 'glass border-white/30 hover:border-grab-green/50 hover:bg-white/60'
            }`}
          >
            <div className="text-2xl mb-2">{preset.emoji}</div>
            <div className="font-semibold text-sm text-gray-800">{preset.label}</div>
          </button>
        ))}
        
        <button
          onClick={() => setShowCustom(true)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            showCustom
              ? 'border-grab-green bg-grab-green/10 shadow-md'
              : 'glass border-white/30 hover:border-grab-green/50 hover:bg-white/60'
          }`}
        >
          <div className="text-2xl mb-2">✏️</div>
          <div className="font-semibold text-sm text-gray-800">Custom amount</div>
        </button>
      </div>
      
      {showCustom && (
        <div className="p-4 glass rounded-xl border-2 border-grab-green shadow-md">
          <div className="text-sm font-semibold text-gray-700 mb-2">💭 Enter your budget:</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g., 15000000"
              className="flex-1 p-3 glass border border-white/30 rounded-lg focus:ring-2 focus:ring-grab-green focus:border-grab-green text-gray-800"
              step="1000000"
              autoFocus
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customAmount || parseInt(customAmount) <= 0}
              className="group relative px-6 py-3 bg-grab-green text-white rounded-lg hover:bg-[#009640] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Set</span>
              <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

