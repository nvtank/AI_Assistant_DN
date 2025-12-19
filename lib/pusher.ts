/**
 * Pusher Client for Realtime Incidents
 * Replaces Socket.IO functionality
 */

import Pusher from 'pusher-js';
import { Incident } from './types';
import { logger } from './logger';

let pusherInstance: Pusher | null = null;
let incidentsChannel: any = null;

/**
 * Initialize Pusher connection
 */
export function initPusher() {
  if (pusherInstance) {
    return pusherInstance;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

  if (!key) {
    logger.error('NEXT_PUBLIC_PUSHER_KEY not found');
    return null;
  }

  pusherInstance = new Pusher(key, {
    cluster: cluster,
    forceTLS: true // Always use HTTPS
  });

  pusherInstance.connection.bind('connected', () => {
    // Connected successfully
  });

  pusherInstance.connection.bind('disconnected', () => {
    logger.warn('Disconnected from Pusher');
  });

  pusherInstance.connection.bind('error', (err: any) => {
    logger.error('Pusher connection error:', err);
  });

  return pusherInstance;
}

/**
 * Subscribe to incidents channel
 */
export function subscribeToIncidents() {
  if (!pusherInstance) {
    pusherInstance = initPusher();
  }

  if (!pusherInstance) {
    logger.error('Cannot subscribe: Pusher not initialized');
    return null;
  }

  if (incidentsChannel) {
    return incidentsChannel;
  }

  incidentsChannel = pusherInstance.subscribe('incidents');

  incidentsChannel.bind('pusher:subscription_succeeded', () => {
    // Subscribed successfully
  });

  incidentsChannel.bind('pusher:subscription_error', (error: any) => {
    logger.error('Failed to subscribe to incidents:', error);
  });

  return incidentsChannel;
}

/**
 * Listen for new incidents
 */
export function onNewIncident(callback: (incident: Incident) => void) {
  const channel = subscribeToIncidents();
  
  if (!channel) {
    logger.error('Cannot listen: Channel not available');
    return () => {}; // Return empty cleanup function
  }
  
  channel.bind('new-incident', (incident: Incident) => {
    callback(incident);
  });

  // Return cleanup function
  return () => {
    channel.unbind('new-incident');
  };
}

/**
 * Unsubscribe from incidents channel
 */
export function unsubscribeFromIncidents() {
  if (incidentsChannel) {
    incidentsChannel.unbind_all();
    pusherInstance?.unsubscribe('incidents');
    incidentsChannel = null;
  }
}

/**
 * Disconnect Pusher
 */
export function disconnectPusher() {
  if (pusherInstance) {
    unsubscribeFromIncidents();
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}

/**
 * Broadcast incident to all clients (via API route)
 */
export async function broadcastIncident(incident: Incident) {
  try {
    const response = await fetch('/api/incidents/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incident),
    });

    if (!response.ok) {
      throw new Error(`Broadcast failed: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    logger.error('Failed to broadcast incident:', error);
    throw error;
  }
}

/**
 * Upload image to Firebase Storage (via API route)
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;

  } catch (error) {
    logger.error('Upload failed:', error);
    throw error;
  }
}
