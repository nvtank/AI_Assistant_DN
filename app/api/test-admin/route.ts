import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

/**
 * GET /api/test-admin
 * Test endpoint to verify Firebase Admin SDK configuration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase Admin SDK configuration...');
    
    // Check environment variables
    const envCheck = {
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    };

    console.log('📋 Environment variables check:', envCheck);

    if (!envCheck.FIREBASE_ADMIN_PROJECT_ID || 
        !envCheck.FIREBASE_ADMIN_CLIENT_EMAIL || 
        !envCheck.FIREBASE_ADMIN_PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck,
        message: 'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your .env file',
      }, { status: 500 });
    }

    // Try to initialize Admin SDK
    try {
      const db = getAdminFirestore();
      console.log('✅ Admin Firestore initialized successfully');
      
      // Try a simple read operation to verify it works
      const testRef = db.collection('online_users').limit(1);
      const snapshot = await testRef.get();
      
      return NextResponse.json({
        success: true,
        message: 'Firebase Admin SDK is configured correctly!',
        envCheck,
        testRead: {
          success: true,
          documentCount: snapshot.size,
        },
      });
    } catch (initError: any) {
      console.error('❌ Admin SDK initialization failed:', initError);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Admin SDK',
        envCheck,
        details: {
          message: initError.message,
          code: initError.code,
          name: initError.name,
        },
        message: 'Check your FIREBASE_ADMIN_PRIVATE_KEY format. It should be in quotes with \\n for newlines.',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
    }, { status: 500 });
  }
}
