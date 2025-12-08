import { NextRequest, NextResponse } from 'next/server';
import { getUserTravelPlans } from '@/lib/travelPlanService';

/**
 * API để lấy danh sách travel plans của user
 * GET /api/travel-plan/list?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const plans = await getUserTravelPlans(userId);

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    console.error('Error fetching travel plans:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch travel plans',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
