import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let initializationError: Error | null = null;

/**
 * Initialize Firebase Admin SDK for server-side operations
 * This bypasses Firestore security rules and should only be used in API routes
 */
export function getAdminApp(): App {
  // Return cached app if already initialized
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized by Firebase Admin
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Check environment variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId) {
    const error = new Error('FIREBASE_ADMIN_PROJECT_ID is not set in environment variables');
    initializationError = error;
    throw error;
  }

  if (!clientEmail) {
    const error = new Error('FIREBASE_ADMIN_CLIENT_EMAIL is not set in environment variables');
    initializationError = error;
    throw error;
  }

  if (!privateKey) {
    const error = new Error('FIREBASE_ADMIN_PRIVATE_KEY is not set in environment variables');
    initializationError = error;
    throw error;
  }

  try {
    // Replace escaped newlines with actual newlines
    let formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // If private key doesn't have BEGIN/END markers, add them
    // This handles cases where the key was copied without the markers
    if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
      // Remove any existing whitespace/newlines but preserve structure
      const keyContent = formattedPrivateKey.trim().replace(/\s+/g, '');
      // Format key with newlines every 64 characters (standard PEM format)
      const formattedKeyContent = keyContent.match(/.{1,64}/g)?.join('\n') || keyContent;
      // Add BEGIN/END markers with proper formatting
      formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${formattedKeyContent}\n-----END PRIVATE KEY-----`;
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    return adminApp;
  } catch (error: any) {
    // Log error details for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to initialize Firebase Admin SDK:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
    }
    
    initializationError = error;
    throw error;
  }
}

/**
 * Get Firestore instance using Admin SDK
 */
export function getAdminFirestore() {
  try {
    const app = getAdminApp();
    return getFirestore(app);
  } catch (error: any) {
    // If initialization failed, provide helpful error message
    if (initializationError) {
      throw new Error(
        `Firebase Admin SDK not configured: ${initializationError.message}. ` +
        'Please check your .env file and ensure FIREBASE_ADMIN_PROJECT_ID, ' +
        'FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set correctly.'
      );
    }
    throw error;
  }
}
