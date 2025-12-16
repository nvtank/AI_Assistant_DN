import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';


// Get user role from Firestore

export async function getUserRole(userId: string): Promise<'user' | 'admin' | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    return (userData?.role as 'user' | 'admin') || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}


// Check if user is admin

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}
