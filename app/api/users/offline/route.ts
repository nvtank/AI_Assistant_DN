import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

/**
 * POST /api/users/offline
 * Mark user as offline (called via sendBeacon on page unload)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'online_users', userId);
    await deleteDoc(userRef);

    console.log('✅ User marked as offline via API:', userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error marking user offline:', error);
    return NextResponse.json(
      { error: 'Failed to mark user offline', details: error.message },
      { status: 500 }
    );
  }
}
