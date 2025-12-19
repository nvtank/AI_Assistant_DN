import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { TravelPlan, ChatConversation } from './types';
import { logger } from './logger';

/**
 * Firebase service cho Travel Plans
 */

// Collection names
const TRAVEL_PLANS_COLLECTION = 'travel_plans';
const CHAT_CONVERSATIONS_COLLECTION = 'chat_conversations';

/**
 * Clean undefined fields from object (Firestore doesn't allow undefined)
 */
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Lưu travel plan mới
 */
export async function saveTravelPlan(plan: TravelPlan): Promise<string> {
  try {
    // Clean undefined fields before saving
    const cleanedPlan = cleanUndefined(plan);
    
    const planData = {
      ...cleanedPlan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, TRAVEL_PLANS_COLLECTION), planData);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving travel plan:', error);
    throw error;
  }
}

/**
 * Cập nhật travel plan
 */
export async function updateTravelPlan(planId: string, updates: Partial<TravelPlan>): Promise<void> {
  try {
    // Clean undefined fields before updating
    const cleanedUpdates = cleanUndefined(updates);
    
    const planRef = doc(db, TRAVEL_PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...cleanedUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logger.error('Error updating travel plan:', error);
    throw error;
  }
}

/**
 * Lấy travel plan theo ID
 */
export async function getTravelPlan(planId: string): Promise<TravelPlan | null> {
  try {
    const planRef = doc(db, TRAVEL_PLANS_COLLECTION, planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return null;
    }

    return {
      id: planSnap.id,
      ...planSnap.data(),
    } as TravelPlan;
  } catch (error) {
    logger.error('Error getting travel plan:', error);
    throw error;
  }
}

/**
 * Get all travel plans for user
 */
export async function getUserTravelPlans(userId: string): Promise<TravelPlan[]> {
  try {
    // Try with orderBy first
    try {
      const q = query(
        collection(db, TRAVEL_PLANS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const plans: TravelPlan[] = [];

      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as TravelPlan);
      });

      return plans;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without orderBy
      if (orderByError.code === 'failed-precondition') {
        logger.warn('Firestore index missing, querying without orderBy', {
          collection: TRAVEL_PLANS_COLLECTION
        });
        
        // Query without orderBy
        const q = query(
          collection(db, TRAVEL_PLANS_COLLECTION),
          where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const plans: TravelPlan[] = [];

        querySnapshot.forEach((doc) => {
          plans.push({
            id: doc.id,
            ...doc.data(),
          } as TravelPlan);
        });

        // Sort manually by createdAt
        plans.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime; // Descending order
        });

        return plans;
      }
      throw orderByError;
    }
  } catch (error) {
    logger.error('Error getting user travel plans:', error);
    throw error;
  }
}

/**
 * Delete travel plan
 */
export async function deleteTravelPlan(planId: string): Promise<void> {
  try {
    const planRef = doc(db, TRAVEL_PLANS_COLLECTION, planId);
    await deleteDoc(planRef);
  } catch (error) {
    logger.error('Error deleting travel plan:', error);
    throw error;
  }
}

/**
 * Cập nhật status của plan
 */
export async function updatePlanStatus(
  planId: string, 
  status: 'draft' | 'confirmed' | 'completed'
): Promise<void> {
  try {
    await updateTravelPlan(planId, { status });
  } catch (error) {
    logger.error('Error updating plan status:', error);
    throw error;
  }
}

/**
 * Share/Unshare plan
 */
export async function togglePlanSharing(planId: string, shared: boolean): Promise<void> {
  try {
    await updateTravelPlan(planId, { shared });
  } catch (error) {
    logger.error('Error toggling plan sharing:', error);
    throw error;
  }
}

// ============= CHAT CONVERSATION =============

/**
 * Lưu chat conversation
 */
export async function saveChatConversation(conversation: ChatConversation): Promise<string> {
  try {
    // Clean undefined fields before saving
    const cleanedConversation = cleanUndefined(conversation);
    
    const conversationData = {
      ...cleanedConversation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, CHAT_CONVERSATIONS_COLLECTION), conversationData);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving chat conversation:', error);
    throw error;
  }
}

/**
 * Cập nhật chat conversation
 */
export async function updateChatConversation(
  conversationId: string, 
  updates: Partial<ChatConversation>
): Promise<void> {
  try {
    // Clean undefined fields before updating
    const cleanedUpdates = cleanUndefined(updates);
    
    const conversationRef = doc(db, CHAT_CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      ...cleanedUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logger.error('Error updating chat conversation:', error);
    throw error;
  }
}

/**
 * Lấy chat conversation theo ID
 */
export async function getChatConversation(conversationId: string): Promise<ChatConversation | null> {
  try {
    const conversationRef = doc(db, CHAT_CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      return null;
    }

    return {
      id: conversationSnap.id,
      ...conversationSnap.data(),
    } as ChatConversation;
  } catch (error) {
    logger.error('Error getting chat conversation:', error);
    throw error;
  }
}

/**
 * Lấy active conversation của user
 */
export async function getUserActiveConversation(userId: string): Promise<ChatConversation | null> {
  try {
    // Try with orderBy first
    try {
      const q = query(
        collection(db, CHAT_CONVERSATIONS_COLLECTION),
        where('userId', '==', userId),
        where('completed', '==', false),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as ChatConversation;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without orderBy
      if (orderByError.code === 'failed-precondition') {
        logger.warn('Firestore index missing for getUserActiveConversation, querying without orderBy', {
          collection: CHAT_CONVERSATIONS_COLLECTION
        });
        
        // Query without orderBy
        const q = query(
          collection(db, CHAT_CONVERSATIONS_COLLECTION),
          where('userId', '==', userId),
          where('completed', '==', false)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return null;
        }

        // Sort manually by updatedAt
        const conversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ChatConversation));

        conversations.sort((a, b) => {
          const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
          const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
          return bTime - aTime; // Descending order
        });

        return conversations[0] || null;
      }
      throw orderByError;
    }
  } catch (error) {
    logger.error('Error getting active conversation:', error);
    throw error;
  }
}

/**
 * Get all conversations for user
 */
export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  try {
    // Try with orderBy first
    try {
      const q = query(
        collection(db, CHAT_CONVERSATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const conversations: ChatConversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          ...data,
        } as ChatConversation);
      });

      // Sort manually if needed (fallback)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      return conversations;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without orderBy
      if (orderByError.code === 'failed-precondition') {
        logger.warn('Firestore index missing, querying without orderBy', {
          collection: 'chat_conversations'
        });
        
        const q = query(
          collection(db, CHAT_CONVERSATIONS_COLLECTION),
          where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const conversations: ChatConversation[] = [];

        querySnapshot.forEach((doc) => {
          conversations.push({
            id: doc.id,
            ...doc.data(),
          } as ChatConversation);
        });

        // Sort manually
        conversations.sort((a, b) => {
          const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 
                       (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 
                       (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return bTime - aTime;
        });

        return conversations;
      }
      throw orderByError;
    }
  } catch (error: any) {
    logger.error('Error getting user conversations:', error);
    throw error;
  }
}

/**
 * Delete conversation
 */
export async function deleteChatConversation(conversationId: string): Promise<void> {
  try {
    const conversationRef = doc(db, CHAT_CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    logger.error('Error deleting chat conversation:', error);
    throw error;
  }
}
