import { NextRequest, NextResponse } from 'next/server';
import { travelPlannerService } from '@/lib/travelPlannerService';
import { saveTravelPlan } from '@/lib/travelPlanService';
import { TravelPlanRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planRequest, userId } = body as {
      planRequest: TravelPlanRequest;
      userId: string;
    };

    console.log('📥 Received request:', { 
      userId, 
      dates: `${planRequest?.startDate} - ${planRequest?.endDate}`,
      people: planRequest?.numberOfPeople 
    });

    if (!planRequest || !userId) {
      console.error('❌ Missing fields:', { planRequest: !!planRequest, userId: !!userId });
      return NextResponse.json(
        { error: 'Missing required fields', details: 'planRequest or userId is missing' },
        { status: 400 }
      );
    }

    // Validate dates (compare strings to avoid timezone issues)
    if (planRequest.startDate > planRequest.endDate) {
      console.error('❌ Invalid dates:', { 
        startDate: planRequest.startDate, 
        endDate: planRequest.endDate 
      });
      return NextResponse.json(
        { 
          error: 'Start date must be before end date', 
          details: `${planRequest.startDate} > ${planRequest.endDate}` 
        },
        { status: 400 }
      );
    }

    // Check environment variables
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const placesKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    const weatherKey = process.env.OPENWEATHER_API_KEY;

    console.log('🔑 API Keys check:', {
      gemini: geminiKey ? '✅ Present' : '❌ Missing',
      places: placesKey ? '✅ Present' : '❌ Missing',
      weather: weatherKey ? '✅ Present' : '❌ Missing',
    });

    if (!geminiKey || !placesKey || !weatherKey) {
      return NextResponse.json(
        { 
          error: 'Missing API keys',
          details: `Missing: ${!geminiKey ? 'Gemini ' : ''}${!placesKey ? 'Places ' : ''}${!weatherKey ? 'Weather' : ''}`
        },
        { status: 500 }
      );
    }

    console.log('🚀 Starting travel plan generation...');
    console.log('User:', userId);
    console.log('Dates:', planRequest.startDate, 'to', planRequest.endDate);

    // Generate travel plan using AI
    const travelPlan = await travelPlannerService.generateTravelPlan(planRequest, userId);

    console.log('✅ Travel plan generated successfully');

    // Save to Firebase
    const planId = await saveTravelPlan(travelPlan);
    travelPlan.id = planId;

    console.log('💾 Travel plan saved with ID:', planId);

    return NextResponse.json({
      success: true,
      planId: planId,
      plan: travelPlan,
    });
  } catch (error: any) {
    console.error('❌ Error generating travel plan:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate travel plan',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
