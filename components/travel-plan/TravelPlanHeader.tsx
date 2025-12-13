'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TravelPlan } from '@/lib/types';
import { exportTravelPlanToExcel } from '@/lib/excelExport';
import { updatePlanStatus } from '@/lib/travelPlanService';

interface TravelPlanHeaderProps {
  plan: TravelPlan;
  onPlanUpdate: (plan: TravelPlan) => void;
}

export default function TravelPlanHeader({ plan, onPlanUpdate }: TravelPlanHeaderProps) {
  const router = useRouter();

  const handleExportExcel = () => {
    try {
      const filename = exportTravelPlanToExcel(plan);
      alert(`✅ Exported successfully!\nFile: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export to Excel. Please try again.');
    }
  };

  const handleConfirm = async () => {
    if (!plan?.id) return;
    try {
      await updatePlanStatus(plan.id, 'confirmed');
      onPlanUpdate({ ...plan, status: 'confirmed' });
      alert('✅ Plan confirmed!');
    } catch (error) {
      console.error('Error confirming plan:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={() => router.push('/')}
              className="group relative text-gray-500 hover:text-grab-green transition-colors p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="border-l border-gray-200 pl-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Travel Plan</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {plan.request.startDate} → {plan.request.endDate} • {plan.days.length} days
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2.5 flex-wrap"
          >
            <button
              onClick={handleExportExcel}
              className="group relative px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-grab-green/50 hover:text-grab-green transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
              title="Export to Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            {plan.status === 'draft' && (
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-grab-green rounded-full hover:bg-[#009640] transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirm Plan</span>
              </button>
            )}
            {plan.status === 'confirmed' && (
              <span className="px-4 py-2.5 text-sm font-semibold text-grab-green bg-grab-green/10 rounded-lg border border-grab-green/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirmed</span>
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

