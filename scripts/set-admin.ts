/**
 * Script to set a user as admin
 * 
 * Usage:
 *   npx tsx scripts/set-admin.ts <email>
 *   npx tsx scripts/set-admin.ts --uid <uid>
 * 
 * Or set environment variables:
 *   ADMIN_EMAIL=user@example.com npm run set-admin
 */

import { getAdminFirestore, getAdminApp } from '../lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

async function setAdmin(email?: string, uid?: string) {
  try {
    if (!email && !uid) {
      console.error('❌ Error: Either email or uid is required');
      console.log('\nUsage:');
      console.log('  npx tsx scripts/set-admin.ts <email>');
      console.log('  npx tsx scripts/set-admin.ts --uid <uid>');
      process.exit(1);
    }

    const db = getAdminFirestore();
    const auth = getAuth(getAdminApp());

    let userId: string;
    let userEmail: string;

    // Get user by email or uid
    if (email) {
      try {
        console.log(`🔍 Looking up user by email: ${email}...`);
        const userRecord = await auth.getUserByEmail(email);
        userId = userRecord.uid;
        userEmail = userRecord.email || email;
        console.log(`✅ Found user: ${userId}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.error(`❌ User with email ${email} not found in Firebase Auth`);
          process.exit(1);
        }
        throw error;
      }
    } else {
      try {
        console.log(`🔍 Looking up user by UID: ${uid}...`);
        const userRecord = await auth.getUser(uid!);
        userId = userRecord.uid;
        userEmail = userRecord.email || 'unknown';
        console.log(`✅ Found user: ${userEmail} (${userId})`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.error(`❌ User with UID ${uid} not found in Firebase Auth`);
          process.exit(1);
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
      console.log(`✅ Updated user ${userEmail} (${userId}) to admin role`);
    } else {
      // Create new user document with admin role
      await userRef.set({
        uid: userId,
        email: userEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Created user document for ${userEmail} (${userId}) with admin role`);
    }

    console.log('\n🎉 Success! User is now an admin.');
    console.log(`   Email: ${userEmail}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Role: admin`);
    console.log('\n💡 The user can now access /admin page');

  } catch (error: any) {
    console.error('❌ Error setting admin:', error.message);
    if (error.message?.includes('FIREBASE_ADMIN')) {
      console.error('\n💡 Make sure Firebase Admin SDK is configured:');
      console.error('   - FIREBASE_ADMIN_PROJECT_ID');
      console.error('   - FIREBASE_ADMIN_CLIENT_EMAIL');
      console.error('   - FIREBASE_ADMIN_PRIVATE_KEY');
    }
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
const emailEnv = process.env.ADMIN_EMAIL;

// Check for --uid flag
const uidIndex = args.indexOf('--uid');
let uid: string | undefined;
let emailArg: string | undefined;

if (uidIndex !== -1 && args[uidIndex + 1]) {
  uid = args[uidIndex + 1];
} else if (args[0] && !args[0].startsWith('--')) {
  // First argument is email if no --uid flag
  emailArg = args[0];
}

setAdmin(emailEnv || emailArg, uid);
