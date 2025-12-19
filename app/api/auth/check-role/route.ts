import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/auth/check-role
 * Check user role (server-side, bypasses Firestore security rules)
 * Requires Authorization header with Firebase ID token
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    try {
      // Verify Firebase Auth token
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;

      // Get user role from Firestore using Admin SDK (bypasses security rules)
      const db = getAdminFirestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return NextResponse.json({
          userId,
          role: null,
          isAdmin: false,
          exists: false,
          message: 'User document does not exist in Firestore',
        });
      }

      const userData = userDoc.data();
      const role = (userData?.role as 'user' | 'admin') || 'user';

      return NextResponse.json({
        userId,
        email: decodedToken.email,
        role,
        isAdmin: role === 'admin',
        exists: true,
      });

    } catch (authError: any) {
      logger.error('Auth verification error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token', details: authError.message },
        { status: 401 }
      );
    }

  } catch (error: any) {
    logger.error('Error checking role:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check role',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
