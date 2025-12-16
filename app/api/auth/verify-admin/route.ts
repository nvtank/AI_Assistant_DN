import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

/**
 * GET /api/auth/verify-admin
 * Verify if the current user is an admin
 * Used by middleware to protect admin routes
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    try {
      // Verify Firebase Auth token using Admin SDK
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;

      // Get user role from Firestore
      const db = getAdminFirestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      const userRole = userData?.role || 'user';

      // Check if user is admin
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        );
      }

      // User is admin
      return NextResponse.json({
        success: true,
        userId,
        role: userRole,
      });
    } catch (authError: any) {
      console.error('Auth verification error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
