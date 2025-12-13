'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TravelPlan, DayPlan } from '@/lib/types';

interface TravelPlanSummaryProps {
  plan: TravelPlan;
  currentDay: DayPlan;
}

export default function TravelPlanSummary({ plan, currentDay }: TravelPlanSummaryProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  } as const;

  return (
    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
      {/* Cost Summary */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-200/50 hover:border-grab-green/30 hover:shadow-md transition-all duration-300"
      >
        <h3 className="text-lg font-bold mb-5 text-gray-900 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span>Cost Overview</span>
        </h3>
        <div className="space-y-3">
          {[
            { label: '🏨 Accommodation', value: plan.totalEstimatedCost.accommodation },
            { label: '🍜 Food', value: plan.totalEstimatedCost.food },
            { label: '🚗 Transportation', value: plan.totalEstimatedCost.transportation },
            { label: '🎯 Activities', value: plan.totalEstimatedCost.activities },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex justify-between items-center py-2.5 border-b border-white/20"
            >
              <span className="text-gray-600 text-sm">{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value.toLocaleString()} VND</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="border-t-2 border-grab-green/30 pt-4 mt-4 flex justify-between items-center bg-grab-green/5 rounded-xl p-3"
          >
            <span className="font-bold text-lg text-gray-900">Total</span>
            <span className="font-bold text-xl text-grab-green">
              {plan.totalEstimatedCost.total.toLocaleString()} VND
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Weather Forecast */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-200/50 hover:border-grab-green/30 hover:shadow-md transition-all duration-300"
      >
        <h3 className="text-lg font-bold mb-5 text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🌤️</span>
          <span>Weather Forecast</span>
        </h3>
        <div className="space-y-3">
          {plan.weatherForecast.map((weather, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-200/50 hover:border-grab-green/30 hover:bg-gray-50 cursor-pointer transition-all duration-200"
            >
              <div>
                <p className="font-semibold text-gray-800 text-sm">{new Date(weather.date).toLocaleDateString('vi-VN')}</p>
                <p className="text-xs text-gray-600">{weather.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-800">{Math.round(weather.temp.max)}°</p>
                <p className="text-xs text-gray-600">{Math.round(weather.temp.min)}°</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trip Info */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-200/50 hover:border-grab-green/30 hover:shadow-md transition-all duration-300"
      >
        <h3 className="text-lg font-bold mb-5 text-gray-900 flex items-center gap-2">
          <span className="text-2xl">ℹ️</span>
          <span>Trip Information</span>
        </h3>
        <div className="space-y-4 text-sm">
          {[
            { label: 'Number of people', value: `${plan.request.numberOfPeople.adults} adults, ${plan.request.numberOfPeople.children} children` },
            { label: 'Travel style', value: plan.request.travelStyle },
            { label: 'Transportation', value: plan.request.transportation },
            { label: 'Accommodation', value: plan.request.accommodation },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="pb-3 border-b border-white/20 last:border-0"
            >
              <p className="text-gray-600 text-xs mb-1.5">{item.label}</p>
              <p className="font-semibold text-gray-800 capitalize">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

