'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TravelPlan, DayPlan } from '@/lib/types';
import { getTravelPlan } from '@/lib/travelPlanService';
import { useAuth } from '@/components/auth/AuthProvider';
import { ActivityCard } from '@/components/common/ActivityCard';
import TravelPlanHeader from '@/components/travel-plan/TravelPlanHeader';
import TravelPlanSummary from '@/components/travel-plan/TravelPlanSummary';
import DaySelector from '@/components/travel-plan/DaySelector';

export default function TravelPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    loadPlan();
  }, [params.id]);

  const loadPlan = async () => {
    try {
      const planId = params.id as string;
      const data = await getTravelPlan(planId);
      setPlan(data);
    } catch (error) {
      console.error('Error loading plan:', error);
      alert('Unable to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = (updatedPlan: TravelPlan) => {
    setPlan(updatedPlan);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-grab-green border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 font-medium"
          >
            Loading your travel plan...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center glass p-8 rounded-3xl shadow-xl border border-white/30"
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Plan not found</h2>
          <button
            onClick={() => router.push('/travel-planner')}
            className="group relative px-6 py-3 text-white bg-grab-green rounded-lg hover:bg-[#009640] font-semibold shadow-lg transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10">Create new plan</span>
            <span className="absolute inset-0 bg-gradient-to-r from-grab-green to-[#00c85a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
        </motion.div>
      </div>
    );
  }

  const currentDay = plan.days[selectedDay];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <TravelPlanHeader plan={plan} onPlanUpdate={handlePlanUpdate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <TravelPlanSummary plan={plan} currentDay={currentDay} />

          {/* Right: Day by Day Schedule */}
          <div className="lg:col-span-2">
            <DaySelector days={plan.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

            {/* Day Schedule */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-200/50"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between mb-6 flex-wrap gap-4 pb-6 border-b border-white/20"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Day {currentDay.day} - {new Date(currentDay.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h2>
                    {currentDay.weather && currentDay.weather.temp && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 text-sm flex items-center gap-2"
                      >
                        <span>{currentDay.weather.condition}</span>
                        <span>•</span>
                        <span>{Math.round(currentDay.weather.temp.min)}° - {Math.round(currentDay.weather.temp.max)}°</span>
                      </motion.p>
                    )}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-right bg-gray-50 px-4 py-3 rounded-xl border border-gray-200/50"
                  >
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Estimated cost</p>
                    <p className="text-xl sm:text-2xl font-bold text-grab-green">
                      {currentDay.estimatedCost.toLocaleString()} VND
                    </p>
                  </motion.div>
                </motion.div>

                {/* Weather Recommendation */}
                <AnimatePresence>
                  {currentDay.weather && currentDay.weather.recommendation ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-blue-50/80 backdrop-blur-sm border-l-4 border-blue-500 p-4 mb-6 rounded-xl"
                    >
                      <p className="text-blue-800 text-sm">{currentDay.weather.recommendation}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-yellow-50/80 backdrop-blur-sm border-l-4 border-yellow-500 p-4 mb-6 rounded-xl"
                    >
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Weather forecast is not available for this date. The date may be too far in the future or weather data could not be retrieved at this time.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timeline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  {currentDay.schedule && currentDay.schedule.length > 0 ? (
                    currentDay.schedule.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                      >
                        <ActivityCard item={item} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-gray-200/50"
                    >
                      No detailed schedule for this day yet
                    </motion.p>
                  )}
                </motion.div>

                {/* Day Notes */}
                {currentDay.notes && currentDay.notes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 bg-yellow-50/80 backdrop-blur-sm border-l-4 border-yellow-500 p-4 rounded-xl"
                  >
                    <h4 className="font-semibold mb-2 text-gray-800">📝 Notes:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {currentDay.notes.map((note, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + idx * 0.05 }}
                          className="text-sm text-gray-700"
                        >
                          {note}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
