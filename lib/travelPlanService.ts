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

    console.log('💾 Saving plan to Firestore:', {
      userId: planData.userId,
      days: planData.days?.length,
      status: planData.status
    });

    const docRef = await addDoc(collection(db, TRAVEL_PLANS_COLLECTION), planData);
    console.log('✅ Plan saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving travel plan:', error);
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
    console.error('Error updating travel plan:', error);
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
    console.error('Error getting travel plan:', error);
    throw error;
  }
}

/**
 * Lấy tất cả travel plans của user
 */
export async function getUserTravelPlans(userId: string): Promise<TravelPlan[]> {
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
  } catch (error) {
    console.error('Error getting user travel plans:', error);
    throw error;
  }
}

/**
 * Xóa travel plan
 */
export async function deleteTravelPlan(planId: string): Promise<void> {
  try {
    const planRef = doc(db, TRAVEL_PLANS_COLLECTION, planId);
    await deleteDoc(planRef);
  } catch (error) {
    console.error('Error deleting travel plan:', error);
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
    console.error('Error updating plan status:', error);
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
    console.error('Error toggling plan sharing:', error);
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
    console.error('Error saving chat conversation:', error);
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
    console.error('Error updating chat conversation:', error);
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
    console.error('Error getting chat conversation:', error);
    throw error;
  }
}

/**
 * Lấy active conversation của user
 */
export async function getUserActiveConversation(userId: string): Promise<ChatConversation | null> {
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
  } catch (error) {
    console.error('Error getting active conversation:', error);
    throw error;
  }
}

/**
 * Lấy tất cả conversations của user
 */
export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  try {
    const q = query(
      collection(db, CHAT_CONVERSATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations: ChatConversation[] = [];

    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
      } as ChatConversation);
    });

    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
}

/**
 * Xóa conversation
 */
export async function deleteChatConversation(conversationId: string): Promise<void> {
  try {
    const conversationRef = doc(db, CHAT_CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error('Error deleting chat conversation:', error);
    throw error;
  }
}
