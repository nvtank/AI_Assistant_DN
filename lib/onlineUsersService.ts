/**
 * Online Users Tracking Service
 * Tracks and displays number of users currently online in realtime
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const ONLINE_USERS_COLLECTION = 'online_users';
const HEARTBEAT_INTERVAL = 20000; // Update every 20 seconds
const TIMEOUT_THRESHOLD = 30000; // Consider offline after 30 seconds

let heartbeatInterval: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;

/**
 * Mark user as online and start heartbeat
 */
export async function markUserOnline(userId: string): Promise<void> {
  try {
    currentUserId = userId;
    const userRef = doc(db, ONLINE_USERS_COLLECTION, userId);

    // Set user as online with current timestamp
    await setDoc(userRef, {
      userId,
      lastSeen: serverTimestamp(),
      online: true,
    });

    console.log('✅ User marked as online:', userId);

    // Start heartbeat to keep user online
    startHeartbeat(userId);
  } catch (error) {
    console.error('❌ Error marking user online:', error);
  }
}

/**
 * Mark user as offline
 */
export async function markUserOffline(userId: string): Promise<void> {
  try {
    if (!userId) return;

    const userRef = doc(db, ONLINE_USERS_COLLECTION, userId);
    await deleteDoc(userRef);

    console.log('✅ User marked as offline:', userId);

    // Stop heartbeat
    stopHeartbeat();
    currentUserId = null;
  } catch (error) {
    console.error('❌ Error marking user offline:', error);
  }
}

/**
 * Start heartbeat to keep user online
 */
function startHeartbeat(userId: string): void {
  // Clear existing interval
  stopHeartbeat();

  // Update every HEARTBEAT_INTERVAL
  heartbeatInterval = setInterval(async () => {
    try {
      const userRef = doc(db, ONLINE_USERS_COLLECTION, userId);
      await setDoc(userRef, {
        userId,
        lastSeen: serverTimestamp(),
        online: true,
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error updating heartbeat:', error);
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop heartbeat
 */
function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Listen to online users count in realtime
 */
export function listenToOnlineUsers(
  callback: (count: number) => void
): () => void {
  try {
    const q = query(collection(db, ONLINE_USERS_COLLECTION));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        let onlineCount = 0;

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const lastSeen = data.lastSeen;

          // Check if user is still active (within timeout threshold)
          if (lastSeen) {
            let lastSeenTime: number;
            if (lastSeen && typeof lastSeen.toMillis === 'function') {
              // Firestore Timestamp
              lastSeenTime = lastSeen.toMillis();
            } else if (lastSeen && typeof lastSeen.getTime === 'function') {
              // JavaScript Date
              lastSeenTime = lastSeen.getTime();
            } else if (typeof lastSeen === 'number') {
              // Unix timestamp
              lastSeenTime = lastSeen;
            } else {
              // Skip if can't parse
              return;
            }

            const timeSinceLastSeen = now - lastSeenTime;

            if (timeSinceLastSeen < TIMEOUT_THRESHOLD) {
              onlineCount++;
            }
          }
        });

        console.log('👥 Online users count:', onlineCount);
        callback(onlineCount);
      },
      (error) => {
        console.error('❌ Error listening to online users:', error);
        callback(0);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up online users listener:', error);
    return () => {};
  }
}

/**
 * Cleanup function - call when component unmounts or user logs out
 */
export function cleanupOnlineUser(): void {
  if (currentUserId) {
    markUserOffline(currentUserId);
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentUserId) {
      // Use sendBeacon for reliable cleanup on page close
      navigator.sendBeacon(
        '/api/users/offline',
        JSON.stringify({ userId: currentUserId })
      );
    }
  });

  // Also handle visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentUserId) {
      // Tab is hidden, but don't mark offline immediately
      // Heartbeat will stop, and user will timeout naturally
    }
  });
}

