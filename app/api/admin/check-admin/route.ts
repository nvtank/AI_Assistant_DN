import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/check-admin?email=xxx or ?uid=xxx
 * Check if a user is admin (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const uid = searchParams.get('uid');

    if (!email && !uid) {
      return NextResponse.json(
        { error: 'Either email or uid query parameter is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const auth = getAuth(getAdminApp());

    let userId: string;
    let userEmail: string;
    let userRecord: any;

    // Get user by email or uid
    if (email) {
      try {
        userRecord = await auth.getUserByEmail(email);
        userId = userRecord.uid;
        userEmail = userRecord.email || email;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with email ${email} not found in Firebase Auth` },
            { status: 404 }
          );
        }
        throw error;
      }
    } else {
      try {
        userRecord = await auth.getUser(uid!);
        userId = userRecord.uid;
        userEmail = userRecord.email || 'unknown';
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with uid ${uid} not found in Firebase Auth` },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // Check Firestore user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    const result: any = {
      userId,
      email: userEmail,
      existsInAuth: true,
      existsInFirestore: userDoc.exists,
      role: null,
      userDocument: null,
    };

    if (userDoc.exists) {
      const userData = userDoc.data();
      result.role = userData?.role || 'not set';
      result.userDocument = userData;
      result.isAdmin = result.role === 'admin';
    } else {
      result.isAdmin = false;
      result.message = 'User document does not exist in Firestore users collection';
    }

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Error checking admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check admin status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
