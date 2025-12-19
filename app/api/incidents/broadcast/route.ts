import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { logger } from '@/lib/logger';

// Initialize Pusher (server-side)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true
});

/**
 * POST /api/incidents/broadcast
 * Broadcast new incident to all connected clients
 */
export async function POST(request: NextRequest) {
  try {
    const incident = await request.json();

    // Broadcast to all connected clients via Pusher
    await pusher.trigger('incidents', 'new-incident', incident);

    return NextResponse.json({ 
      success: true,
      message: 'Incident broadcasted successfully' 
    });

  } catch (error: any) {
    logger.error('Failed to broadcast incident:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast incident', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/incidents/health
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'incidents-api',
    pusher: pusher ? 'connected' : 'disconnected'
  });
}
