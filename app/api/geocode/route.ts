import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy Nominatim reverse geocoding requests
 * This fixes CORS issues by making the request from the server
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat or lng parameters' },
        { status: 400 }
      );
    }

    // Add User-Agent header as required by Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GrabTheBeyond/1.0 (https://grabthebeyond.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      address: data.display_name || 'Address not available',
      data: data,
    });
  } catch (error: any) {
    console.error('Error in geocode API:', error);
    return NextResponse.json(
      { error: 'Failed to get address', details: error.message },
      { status: 500 }
    );
  }
}

