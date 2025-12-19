import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminApp } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/set-admin
 * Set a user as admin by email or UID
 * 
 * Body: { email?: string, uid?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json();

    if (!email && !uid) {
      return NextResponse.json(
        { error: 'Either email or uid is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const auth = getAuth(getAdminApp());

    let userId: string;
    let userEmail: string;

    // Get user by email or uid
    if (email) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        userId = userRecord.uid;
        userEmail = userRecord.email || email;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with email ${email} not found` },
            { status: 404 }
          );
        }
        throw error;
      }
    } else {
      try {
        const userRecord = await auth.getUser(uid!);
        userId = userRecord.uid;
        userEmail = userRecord.email || 'unknown';
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with uid ${uid} not found` },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // Check if user document exists in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user document
      await userRef.update({
        role: 'admin',
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Updated user ${userId} (${userEmail}) to admin`);
    } else {
      // Create new user document with admin role
      await userRef.set({
        uid: userId,
        email: userEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Created user document for ${userId} (${userEmail}) with admin role`);
    }

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} (${userId}) has been set as admin`,
      userId,
      email: userEmail,
      role: 'admin',
    });

  } catch (error: any) {
    logger.error('Error setting admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set admin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/set-admin?email=xxx or ?uid=xxx
 * Set a user as admin via query parameters
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

    // Get user by email or uid
    if (email) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        userId = userRecord.uid;
        userEmail = userRecord.email || email;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with email ${email} not found` },
            { status: 404 }
          );
        }
        throw error;
      }
    } else {
      try {
        const userRecord = await auth.getUser(uid!);
        userId = userRecord.uid;
        userEmail = userRecord.email || 'unknown';
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: `User with uid ${uid} not found` },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // Check if user document exists in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user document
      await userRef.update({
        role: 'admin',
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Updated user ${userId} (${userEmail}) to admin`);
    } else {
      // Create new user document with admin role
      await userRef.set({
        uid: userId,
        email: userEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Created user document for ${userId} (${userEmail}) with admin role`);
    }

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} (${userId}) has been set as admin`,
      userId,
      email: userEmail,
      role: 'admin',
    });

  } catch (error: any) {
    logger.error('Error setting admin (GET):', error);
    return NextResponse.json(
      { 
        error: 'Failed to set admin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
