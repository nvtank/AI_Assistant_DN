import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * POST /api/incidents/approve
 * Approve an incident
 */
export async function POST(request: NextRequest) {
  try {
    const { incidentId } = await request.json();

    if (!incidentId) {
      return NextResponse.json(
        { error: 'incidentId is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const incidentRef = db.collection('incident_report').doc(incidentId);

    // Get incident before updating
    const incidentDoc = await incidentRef.get();
    if (!incidentDoc.exists) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Update incident to verified
    await incidentRef.update({
      verified: true,
      verifiedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Incident approved successfully.',
    });

  } catch (error: any) {
    logger.error('Error approving incident:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve incident',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
