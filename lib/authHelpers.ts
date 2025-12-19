import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from './logger';


// Get user role from Firestore
// Use source: 'server' to bypass cache and get fresh data

export async function getUserRole(userId: string, forceRefresh: boolean = false): Promise<'user' | 'admin' | null> {
  try {
    // Use getDocFromCache or getDocFromServer to bypass cache if needed
    const userDocRef = doc(db, 'users', userId);
    
    let userDoc;
    if (forceRefresh) {
      // Force get from server, bypass cache
      const { getDocFromServer } = await import('firebase/firestore');
      userDoc = await getDocFromServer(userDocRef);
    } else {
      userDoc = await getDoc(userDocRef);
    }
    
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    const role = (userData?.role as 'user' | 'admin') || 'user';
    
    return role;
  } catch (error) {
    logger.error('Error getting user role:', error);
    return null;
  }
}


// Check if user is admin
// forceRefresh: if true, bypasses Firestore cache to get fresh data

export async function isAdmin(userId: string, forceRefresh: boolean = true): Promise<boolean> {
  const role = await getUserRole(userId, forceRefresh);
  return role === 'admin';
}
