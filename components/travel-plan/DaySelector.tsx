'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DayPlan } from '@/lib/types';

interface DaySelectorProps {
  days: DayPlan[];
  selectedDay: number;
  onSelectDay: (index: number) => void;
}

export default function DaySelector({ days, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-4 mb-4 sm:mb-6 border border-gray-200/50"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + idx * 0.05 }}
            onClick={() => onSelectDay(idx)}
            className={`relative px-5 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedDay === idx
                ? 'text-grab-green'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {selectedDay === idx && (
              <motion.div
                layoutId="activeDay"
                className="absolute inset-0 bg-grab-green/10 border-2 border-grab-green rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 block text-sm">
              <span className="font-bold">Day {day.day}</span>
              <br />
              <span className="text-xs font-medium opacity-70">
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

