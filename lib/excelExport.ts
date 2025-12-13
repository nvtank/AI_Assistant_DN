import * as XLSX from 'xlsx';
import { TravelPlan, DayPlan, ActivitySchedule } from './types';


export function exportTravelPlanToExcel(plan: TravelPlan) {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview (Tổng quan) - Clean Format
  const overviewData = [
    ['DA NANG TRAVEL ITINERARY'],
    [''],
    ['TRIP INFORMATION'],
    ['Field', 'Details'],
    ['Start Date', plan.request.startDate],
    ['End Date', plan.request.endDate],
    ['Duration', `${plan.days.length} days`],
    ['Travelers', `${plan.request.numberOfPeople.adults} adults, ${plan.request.numberOfPeople.children} children`],
    ['Budget Range', `${plan.request.budget.min.toLocaleString()} - ${plan.request.budget.max.toLocaleString()} VND`],
    ['Accommodation', plan.request.accommodation],
    ['Transportation', plan.request.transportation],
    [''],
    ['COST SUMMARY'],
    ['Total Estimated Cost', (() => {
      const cost = typeof plan.totalEstimatedCost === 'number' 
        ? plan.totalEstimatedCost 
        : (plan.totalEstimatedCost?.total || 0);
      return `${cost.toLocaleString()} VND`;
    })()],
    [''],
    ['PREFERENCES'],
    ['Travel Style', (plan.request.travelStyle || []).join(', ')],
    ['Food Preferences', (plan.request.foodPreferences || []).join(', ')],
    ['Allergies', (plan.request.allergies || []).join(', ') || 'None'],
    ['Restrictions', (plan.request.restrictions || []).join(', ') || 'None'],
    ['Special Requirements', plan.request.specialRequirements || 'None'],
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  
  // Set column widths
  overviewSheet['!cols'] = [
    { wch: 25 },
    { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Sheet 2: Quick Summary (Tóm tắt nhanh)
  const summaryData: any[][] = [
    ['QUICK DAILY SUMMARY'],
    [''],
    ['Day', 'Date', 'Weather', 'Highlights', 'Meals', 'Cost'],
  ];

  plan.days.forEach((day: DayPlan) => {
    const highlights = day.schedule
      ?.filter(s => s.activity.type === 'attraction' || s.activity.type === 'activity')
      .slice(0, 3)
      .map(s => s.activity.name)
      .join(', ') || 'Relaxation day';

    const meals = [
      day.mealPlan?.breakfast?.name,
      day.mealPlan?.lunch?.name,
      day.mealPlan?.dinner?.name,
    ].filter(Boolean).join(' • ');

    const weather = day.weather && day.weather.temp
      ? `${day.weather.condition} ${Math.round(day.weather.temp.min)}°-${Math.round(day.weather.temp.max)}°C`
      : 'N/A';

    summaryData.push([
      `Day ${day.day}`,
      day.date,
      weather,
      highlights,
      meals,
      `${day.estimatedCost.toLocaleString()} đ`,
    ]);
  });

  summaryData.push(['']);
  
  const totalCost = typeof plan.totalEstimatedCost === 'number' 
    ? plan.totalEstimatedCost 
    : (plan.totalEstimatedCost?.total || 0);
  
  summaryData.push([
    'TOTAL',
    `${plan.days.length} days`,
    '',
    '',
    '',
    `${totalCost.toLocaleString()} VND`,
  ]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  summarySheet['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 20 },
    { wch: 50 },
    { wch: 40 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Quick Summary');

  // Sheet 3: Detailed Itinerary (Lịch trình chi tiết)
  const itineraryData: any[][] = [
    ['DETAILED DAILY ITINERARY'],
    ['Complete hour-by-hour schedule with all activities, meals and travel details'],
    [''],
  ];

  plan.days.forEach((day: DayPlan) => {
    // Day header
    itineraryData.push([
      `DAY ${day.day} - ${day.date} (${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })})`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    
    // Weather summary
    if (day.weather && day.weather.temp) {
      itineraryData.push([
        'Weather',
        `${day.weather.condition}, ${Math.round(day.weather.temp.min)}°C - ${Math.round(day.weather.temp.max)}°C`,
        day.weather.recommendation || '',
        '',
        '',
        '',
        '',
        '',
      ]);
    }
    
    // Day notes if any
    if (day.notes && day.notes.length > 0) {
      day.notes.forEach(note => {
        itineraryData.push(['Note', note, '', '', '', '', '', '']);
      });
    }

    itineraryData.push(['']);
    itineraryData.push([
      'TIME',
      'DURATION',
      'ACTIVITY',
      'TYPE',
      'DESCRIPTION',
      'ADDRESS',
      'PHONE',
      'COST',
    ]);

    // Activities with full details
    day.schedule?.forEach((item: ActivitySchedule, idx: number) => {
      const activity = item.activity;
      
      // Main activity row
      itineraryData.push([
        item.time,
        `${item.duration} min`,
        activity.name,
        activity.type,
        activity.description || '',
        activity.location?.address || '',
        activity.phone || '',
        `${(activity.estimatedCost || 0).toLocaleString()} VND`,
      ]);

      // Additional details row (if exists)
      const details: string[] = [];
      if (activity.rating) details.push(`Rating: ${activity.rating}/5`);
      if (activity.openingHours) {
        const hours = Array.isArray(activity.openingHours) 
          ? activity.openingHours.join(', ') 
          : activity.openingHours;
        details.push(`Hours: ${hours}`);
      }
      if (activity.tips && activity.tips.length > 0) {
        details.push(`Tips: ${activity.tips.join('; ')}`);
      }

      if (details.length > 0) {
        itineraryData.push([
          '',
          '',
          '',
          '',
          details.join(' | '),
          '',
          '',
          '',
        ]);
      }

      // Links row (if exists)
      const links: string[] = [];
      if (activity.googleMapsLink) links.push(`Maps: ${activity.googleMapsLink}`);
      if (activity.website) links.push(`Website: ${activity.website}`);
      if (activity['tik-tok']) links.push(`TikTok: ${activity['tik-tok']}`);
      if (activity['social-link']) links.push(`Social: ${activity['social-link']}`);

      if (links.length > 0) {
        itineraryData.push([
          '',
          '',
          '',
          '',
          links.join(' | '),
          '',
          '',
          '',
        ]);
      }

      // Travel to next location
      if (item.travelTime && item.travelDistance) {
        itineraryData.push([
          '',
          `${item.travelTime} min`,
          'Travel',
          'transport',
          `${item.travelDistance.toFixed(1)} km via Grab/Taxi`,
          '',
          '',
          `${(item.transportCost || 0).toLocaleString()} VND`,
        ]);
      }
    });

    // Meal plan summary for the day
    itineraryData.push(['', '', '', '', '', '', '', '']);
    itineraryData.push(['MEALS', '', '', '', '', '', '', '']);
    
    if (day.mealPlan) {
      if (day.mealPlan.breakfast) {
        itineraryData.push([
          'Breakfast',
          day.mealPlan.breakfast.name,
          day.mealPlan.breakfast.location?.address || '',
          '',
          day.mealPlan.breakfast.description || '',
          '',
          '',
          `${(day.mealPlan.breakfast.estimatedCost || 0).toLocaleString()} VND`,
        ]);
      }
      if (day.mealPlan.lunch) {
        itineraryData.push([
          'Lunch',
          day.mealPlan.lunch.name,
          day.mealPlan.lunch.location?.address || '',
          '',
          day.mealPlan.lunch.description || '',
          '',
          '',
          `${(day.mealPlan.lunch.estimatedCost || 0).toLocaleString()} VND`,
        ]);
      }
      if (day.mealPlan.dinner) {
        itineraryData.push([
          'Dinner',
          day.mealPlan.dinner.name,
          day.mealPlan.dinner.location?.address || '',
          '',
          day.mealPlan.dinner.description || '',
          '',
          '',
          `${(day.mealPlan.dinner.estimatedCost || 0).toLocaleString()} VND`,
        ]);
      }
    }

    // Day total
    itineraryData.push(['', '', '', '', '', '', '', '']);
    itineraryData.push([
      '',
      '',
      `Day ${day.day} Total`,
      '',
      '',
      '',
      '',
      `${day.estimatedCost.toLocaleString()} VND`,
    ]);

    // Separator between days
    itineraryData.push(['', '', '', '', '', '', '', '']);
    itineraryData.push(['', '', '', '', '', '', '', '']);
  });

  const itinerarySheet = XLSX.utils.aoa_to_sheet(itineraryData);
  
  itinerarySheet['!cols'] = [
    { wch: 12 },  // TIME
    { wch: 14 },  // DURATION
    { wch: 35 },  // ACTIVITY NAME
    { wch: 14 },  // TYPE
    { wch: 60 },  // DESCRIPTION
    { wch: 45 },  // ADDRESS
    { wch: 16 },  // PHONE
    { wch: 16 },  // COST
  ];

  XLSX.utils.book_append_sheet(workbook, itinerarySheet, 'Detailed Itinerary');

  // Sheet 4: Meal Plan
  const mealData: any[][] = [
    ['MEAL PLAN'],
    [''],
    ['Day', 'Date', 'Breakfast', 'Lunch', 'Dinner'],
  ];

  plan.days.forEach((day: DayPlan) => {
    const meals = day.mealPlan;
    mealData.push([
      `Day ${day.day}`,
      day.date,
      meals?.breakfast?.name || 'Not specified',
      meals?.lunch?.name || 'Not specified',
      meals?.dinner?.name || 'Not specified',
    ]);
  });

  const mealSheet = XLSX.utils.aoa_to_sheet(mealData);
  
  mealSheet['!cols'] = [
    { wch: 10 },
    { wch: 14 },
    { wch: 35 },
    { wch: 35 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(workbook, mealSheet, 'Meal Plan');

  // Sheet 5: Budget Breakdown
  const budgetData: any[][] = [
    ['BUDGET BREAKDOWN'],
    [''],
    ['Category', 'Description', 'Cost (VND)', '%'],
  ];

  // Calculate costs by category
  let totalActivities = 0;
  let totalMeals = 0;
  let totalTransport = 0;

  plan.days.forEach((day: DayPlan) => {
    day.schedule?.forEach((item: ActivitySchedule) => {
      const cost = item.activity.estimatedCost || 0;
      
      if (item.activity.type === 'restaurant' || item.activity.type === 'cafe') {
        totalMeals += cost;
      } else {
        totalActivities += cost;
      }
      
      if (item.transportCost) {
        totalTransport += item.transportCost;
      }
    });
  });

  const total = typeof plan.totalEstimatedCost === 'number' 
    ? plan.totalEstimatedCost 
    : (plan.totalEstimatedCost?.total || 1);

  budgetData.push([
    'Activities & Attractions',
    'Entrance fees, tours, activities',
    totalActivities.toLocaleString(),
    total > 0 ? `${((totalActivities / total) * 100).toFixed(1)}%` : '0%',
  ]);

  budgetData.push([
    'Food & Beverages',
    'Breakfast, lunch, dinner, snacks',
    totalMeals.toLocaleString(),
    total > 0 ? `${((totalMeals / total) * 100).toFixed(1)}%` : '0%',
  ]);

  budgetData.push([
    'Transportation',
    'Grab, taxi, motorbike rental',
    totalTransport.toLocaleString(),
    total > 0 ? `${((totalTransport / total) * 100).toFixed(1)}%` : '0%',
  ]);

  budgetData.push(['']);
  budgetData.push([
    'TOTAL',
    `Complete ${plan.days.length}-day trip`,
    total.toLocaleString(),
    '100%',
  ]);

  const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
  
  budgetSheet['!cols'] = [
    { wch: 30 },
    { wch: 50 },
    { wch: 18 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');

  // Sheet 6: Contact Information
  const contactData: any[][] = [
    ['CONTACT INFORMATION'],
    [''],
    ['Location', 'Phone', 'Address', 'Google Maps'],
  ];

  // Collect all unique activities with contact info
  const uniqueActivities = new Map<string, any>();
  
  plan.days.forEach((day: DayPlan) => {
    day.schedule?.forEach((item: ActivitySchedule) => {
      const activity = item.activity;
      if (activity.name && !uniqueActivities.has(activity.name)) {
        uniqueActivities.set(activity.name, {
          name: activity.name,
          phone: activity.phone || 'N/A',
          address: activity.location?.address || 'N/A',
          googleMapsUrl: activity.googleMapsLink || 'N/A',
        });
      }
    });
  });

  uniqueActivities.forEach((activity) => {
    contactData.push([
      activity.name,
      activity.phone,
      activity.address,
      activity.googleMapsUrl,
    ]);
  });

  const contactSheet = XLSX.utils.aoa_to_sheet(contactData);
  
  contactSheet['!cols'] = [
    { wch: 35 },
    { wch: 18 },
    { wch: 55 },
    { wch: 65 },
  ];

  XLSX.utils.book_append_sheet(workbook, contactSheet, 'Contacts');

  // Sheet 7: Tips & Recommendations
  const tipsData: any[][] = [
    ['TIPS & RECOMMENDATIONS'],
    [''],
    ['Category', 'Recommendation', 'Details'],
  ];

  // Weather-based tips
  tipsData.push(['']);
  tipsData.push(['WEATHER TIPS']);
  
  plan.days.forEach((day: DayPlan) => {
    if (day.weather?.recommendation) {
      tipsData.push([
        `Day ${day.day}`,
        day.weather.recommendation,
        `${day.weather.condition} - ${Math.round(day.weather.temp.min)}-${Math.round(day.weather.temp.max)}°C`,
      ]);
    }
  });

  // Activity tips
  tipsData.push(['']);
  tipsData.push(['ACTIVITY TIPS']);
  
  const allTips = new Set<string>();
  plan.days.forEach((day: DayPlan) => {
    day.schedule?.forEach((item: ActivitySchedule) => {
      if (item.activity.tips && item.activity.tips.length > 0) {
        item.activity.tips.forEach(tip => allTips.add(`${item.activity.name}: ${tip}`));
      }
    });
  });

  allTips.forEach((tip) => {
    tipsData.push(['', tip, '']);
  });

  // Travel preferences
  tipsData.push(['']);
  tipsData.push(['YOUR PREFERENCES']);
  
  tipsData.push(['Travel Style', (plan.request.travelStyle || []).join(', '), '']);
  tipsData.push(['Food Preferences', (plan.request.foodPreferences || []).join(', '), '']);
  if (plan.request.allergies && plan.request.allergies.length > 0) {
    tipsData.push(['Allergies', plan.request.allergies.join(', '), 'Considered in meal planning']);
  }
  if (plan.request.restrictions && plan.request.restrictions.length > 0) {
    tipsData.push(['Restrictions', plan.request.restrictions.join(', '), 'Avoided in itinerary']);
  }
  if (plan.request.specialRequirements) {
    tipsData.push(['Special Requirements', plan.request.specialRequirements, '✓ Applied to plan']);
  }

  // Best practices
  tipsData.push(['', '', '']);
  tipsData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '']);
  tipsData.push(['📋 GENERAL TIPS FOR DA NANG - Essential Information', '', '']);
  tipsData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '']);
  tipsData.push(['Best Time to Visit', 'February - May', 'Pleasant weather, less rain']);
  tipsData.push(['Currency', 'Vietnamese Dong (VND)', 'USD also widely accepted']);
  tipsData.push(['Transportation', 'Grab is most convenient', 'Download app before arrival']);
  tipsData.push(['Language', 'Vietnamese', 'English spoken in tourist areas']);
  tipsData.push(['Emergency', '113 (Police), 114 (Fire), 115 (Ambulance)', 'Save these numbers']);
  tipsData.push(['Tipping', 'Not required but appreciated', '5-10% in restaurants']);

  const tipsSheet = XLSX.utils.aoa_to_sheet(tipsData);
  
  tipsSheet['!cols'] = [
    { wch: 30 },
    { wch: 70 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(workbook, tipsSheet, 'Tips');

  // Generate filename with date and time
  const startDate = new Date(plan.request.startDate).toISOString().split('T')[0];
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const filename = `DaNang_Travel_Plan_${startDate}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);

  return filename;
}


export function exportTravelPlanToCSV(plan: TravelPlan) {
  const csvData: any[][] = [
    ['Day', 'Date', 'Time', 'Duration', 'Activity', 'Type', 'Cost', 'Address', 'Phone', 'Notes'],
  ];

  plan.days.forEach((day: DayPlan) => {
    day.schedule?.forEach((item: ActivitySchedule) => {
      const activity = item.activity;
      csvData.push([
        day.day,
        day.date,
        item.time,
        item.duration,
        activity.name,
        activity.type,
        activity.estimatedCost || 0,
        activity.location?.address || '',
        activity.phone || '',
        item.notes || '',
      ]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const startDate = new Date(plan.request.startDate).toISOString().split('T')[0];
  const filename = `DaNang_Travel_Plan_${startDate}.csv`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return filename;
}
