import { Incident } from './types';

const INCIDENTS_KEY = 'grab_incidents';
const PENDING_INCIDENTS_KEY = 'grab_pending_incidents';

// Event system for real-time updates
type IncidentUpdateListener = () => void;
const listeners: IncidentUpdateListener[] = [];

export const subscribeToIncidentUpdates = (callback: IncidentUpdateListener) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Get all verified incidents (for map display)
export const getVerifiedIncidents = (): Incident[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(INCIDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

// Get all pending incidents (for admin review)
export const getPendingIncidents = (): Incident[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PENDING_INCIDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

// Report new incident (goes to pending)
export const reportIncident = (incident: Omit<Incident, 'id' | 'status' | 'createdAt'>): Incident => {
  if (typeof window === 'undefined') throw new Error('Not in browser');
  
  const pendingIncidents = getPendingIncidents();
  const newIncident: Incident = {
    ...incident,
    id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  pendingIncidents.push(newIncident);
  localStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(pendingIncidents));
  notifyListeners();
  
  return newIncident;
};

// Admin: Approve incident (move from pending to verified)
export const approveIncident = (incidentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const pendingIncidents = getPendingIncidents();
  const verifiedIncidents = getVerifiedIncidents();
  
  const incidentIndex = pendingIncidents.findIndex(inc => inc.id === incidentId);
  if (incidentIndex === -1) return false;
  
  const incident = pendingIncidents[incidentIndex];
  incident.status = 'verified';
  incident.verifiedAt = new Date().toISOString();
  
  // Move to verified
  verifiedIncidents.push(incident);
  pendingIncidents.splice(incidentIndex, 1);
  
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(verifiedIncidents));
  localStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(pendingIncidents));
  notifyListeners();
  
  return true;
};

// Admin: Reject incident (remove from pending)
export const rejectIncident = (incidentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const pendingIncidents = getPendingIncidents();
  const incidentIndex = pendingIncidents.findIndex(inc => inc.id === incidentId);
  
  if (incidentIndex === -1) return false;
  
  pendingIncidents.splice(incidentIndex, 1);
  localStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(pendingIncidents));
  notifyListeners();
  
  return true;
};

// Admin: Delete verified incident
export const deleteIncident = (incidentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const verifiedIncidents = getVerifiedIncidents();
  const incidentIndex = verifiedIncidents.findIndex(inc => inc.id === incidentId);
  
  if (incidentIndex === -1) return false;
  
  verifiedIncidents.splice(incidentIndex, 1);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(verifiedIncidents));
  notifyListeners();
  
  return true;
};

// Get incident statistics
export const getIncidentStats = () => {
  const verified = getVerifiedIncidents();
  const pending = getPendingIncidents();
  
  return {
    total: verified.length + pending.length,
    verified: verified.length,
    pending: pending.length,
    byType: {
      flooding: verified.filter(i => i.type === 'flooding').length,
      pothole: verified.filter(i => i.type === 'pothole').length,
      construction: verified.filter(i => i.type === 'construction').length,
      traffic: verified.filter(i => i.type === 'traffic').length,
    },
    bySeverity: {
      low: verified.filter(i => i.severity_level === 'low').length,
      medium: verified.filter(i => i.severity_level === 'medium').length,
      critical: verified.filter(i => i.severity_level === 'critical').length,
    }
  };
};
