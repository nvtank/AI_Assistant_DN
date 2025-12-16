import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentChangeType,
} from 'firebase/firestore';
import { db } from './firebase';
import { Incident, Location } from './types';
import { logger } from './logger';

const INCIDENTS_COLLECTION = 'incident_report';

// Types for listener callback
type IncidentUpdateListener = (incidents: Incident[]) => void;
type IncidentChangeListener = (
  change: {
    type: DocumentChangeType;
    incident: Incident;
  }
) => void;

const listeners: IncidentUpdateListener[] = [];
const changeListeners: IncidentChangeListener[] = [];

// Subscribe to general incident updates
export const subscribeToIncidentUpdates = (callback: IncidentUpdateListener) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Subscribe to specific incident changes
export const subscribeToIncidentChanges = (callback: IncidentChangeListener) => {
  changeListeners.push(callback);
  return () => {
    const index = changeListeners.indexOf(callback);
    if (index > -1) {
      changeListeners.splice(index, 1);
    }
  };
};

// Setup realtime listener for verified incidents
export const listenToVerifiedIncidents = (callback: (incidents: Incident[]) => void) => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      where('verified', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const incidents: Incident[] = [];
      snapshot.forEach((doc) => {
        incidents.push({
          id: doc.id,
          ...doc.data(),
        } as Incident);
      });
      callback(incidents);
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Error listening to verified incidents:', error);
    return () => {};
  }
};

// Setup realtime listener for pending incidents
export const listenToPendingIncidents = (callback: (incidents: Incident[]) => void) => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      where('verified', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const incidents: Incident[] = [];
      snapshot.forEach((doc) => {
        incidents.push({
          id: doc.id,
          ...doc.data(),
        } as Incident);
      });
      callback(incidents);
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Error listening to pending incidents:', error);
    return () => {};
  }
};

// Get all verified incidents (one-time fetch)
export const getVerifiedIncidents = async (): Promise<Incident[]> => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      where('verified', '==', true)
    );
    const snapshot = await getDocs(q);
    const incidents: Incident[] = [];
    snapshot.forEach((doc) => {
      incidents.push({
        id: doc.id,
        ...doc.data(),
      } as Incident);
    });
    return incidents;
  } catch (error) {
    logger.error('Error getting verified incidents:', error);
    return [];
  }
};

// Get all pending incidents (one-time fetch)
export const getPendingIncidents = async (): Promise<Incident[]> => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      where('verified', '==', false)
    );
    const snapshot = await getDocs(q);
    const incidents: Incident[] = [];
    snapshot.forEach((doc) => {
      incidents.push({
        id: doc.id,
        ...doc.data(),
      } as Incident);
    });
    return incidents;
  } catch (error) {
    logger.error('Error getting pending incidents:', error);
    return [];
  }
};

// Report new incident (goes to pending)
export const reportIncident = async (incident: Omit<Incident, 'id' | 'verified' | 'createdAt'>): Promise<Incident> => {
  try {
    const newIncident = {
      ...incident,
      verified: false, // New reports are not verified
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, INCIDENTS_COLLECTION), newIncident);

    return {
      ...newIncident,
      id: docRef.id,
    } as Incident;
  } catch (error) {
    logger.error('Error reporting incident:', error);
    throw error;
  }
};

// Admin: Approve incident (set verified to true)
export const approveIncident = async (incidentId: string): Promise<boolean> => {
  try {
    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    await updateDoc(incidentRef, {
      verified: true,
      verifiedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    logger.error('Error approving incident:', error);
    return false;
  }
};

// Admin: Reject incident (delete from collection)
export const rejectIncident = async (incidentId: string): Promise<boolean> => {
  try {
    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    await deleteDoc(incidentRef);
    return true;
  } catch (error) {
    logger.error('Error rejecting incident:', error);
    return false;
  }
};

// Admin: Delete verified incident
export const deleteIncident = async (incidentId: string): Promise<boolean> => {
  try {
    const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
    await deleteDoc(incidentRef);
    return true;
  } catch (error) {
    logger.error('Error deleting incident:', error);
    return false;
  }
};

// Get incident statistics
export const getIncidentStats = async () => {
  try {
    const verified = await getVerifiedIncidents();
    const pending = await getPendingIncidents();

    return {
      total: verified.length + pending.length,
      verified: verified.length,
      pending: pending.length,
      byType: {
        flooding: verified.filter((i) => i.type === 'flooding').length,
        pothole: verified.filter((i) => i.type === 'pothole').length,
        construction: verified.filter((i) => i.type === 'construction').length,
        traffic: verified.filter((i) => i.type === 'traffic').length,
      },
      bySeverity: {
        low: verified.filter((i) => i.severity_level === 'low').length,
        medium: verified.filter((i) => i.severity_level === 'medium').length,
        critical: verified.filter((i) => i.severity_level === 'critical').length,
      },
    };
  } catch (error) {
    logger.error('Error getting incident stats:', error);
    return {
      total: 0,
      verified: 0,
      pending: 0,
      byType: { flooding: 0, pothole: 0, construction: 0, traffic: 0 },
      bySeverity: { low: 0, medium: 0, critical: 0 },
    };
  }
};
