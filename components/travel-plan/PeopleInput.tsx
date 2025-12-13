'use client';

import React from 'react';

interface PeopleInputProps {
  adults: number;
  children: number;
  onChange: (adults: number, children: number) => void;
}

export default function PeopleInput({ adults, children, onChange }: PeopleInputProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/30">
        <span className="font-medium text-gray-800">👨 Adults</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(Math.max(1, adults - 1), children)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-grab-green/10 hover:border-grab-green border border-white/30 transition-all"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-gray-800">{adults}</span>
          <button
            onClick={() => onChange(adults + 1, children)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-grab-green/10 hover:border-grab-green border border-white/30 transition-all"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/30">
        <span className="font-medium text-gray-800">👶 Children</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(adults, Math.max(0, children - 1))}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-grab-green/10 hover:border-grab-green border border-white/30 transition-all"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-gray-800">{children}</span>
          <button
            onClick={() => onChange(adults, children + 1)}
            className="w-10 h-10 bg-white rounded-full shadow-md hover:bg-grab-green/10 hover:border-grab-green border border-white/30 transition-all"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

