/**
 * Pusher Client for Realtime Incidents
 * Replaces Socket.IO functionality
 */

import Pusher from 'pusher-js';
import { Incident } from './types';

let pusherInstance: Pusher | null = null;
let incidentsChannel: any = null;

/**
 * Initialize Pusher connection
 */
export function initPusher() {
  if (pusherInstance) {
    console.log('✅ Pusher already initialized');
    return pusherInstance;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

  if (!key) {
    console.error('❌ NEXT_PUBLIC_PUSHER_KEY not found');
    return null;
  }

  console.log('🔌 Initializing Pusher...');
  console.log(`   Key: ${key.substring(0, 10)}...`);
  console.log(`   Cluster: ${cluster}`);

  pusherInstance = new Pusher(key, {
    cluster: cluster,
    forceTLS: true // Always use HTTPS
  });

  pusherInstance.connection.bind('connected', () => {
    console.log('✅ Connected to Pusher');
  });

  pusherInstance.connection.bind('disconnected', () => {
    console.log('⚠️ Disconnected from Pusher');
  });

  pusherInstance.connection.bind('error', (err: any) => {
    console.error('❌ Pusher connection error:', err);
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
    console.error('❌ Cannot subscribe: Pusher not initialized');
    return null;
  }

  if (incidentsChannel) {
    console.log('✅ Already subscribed to incidents channel');
    return incidentsChannel;
  }

  console.log('📡 Subscribing to incidents channel...');
  incidentsChannel = pusherInstance.subscribe('incidents');

  incidentsChannel.bind('pusher:subscription_succeeded', () => {
    console.log('✅ Subscribed to incidents channel');
  });

  incidentsChannel.bind('pusher:subscription_error', (error: any) => {
    console.error('❌ Failed to subscribe to incidents:', error);
  });

  return incidentsChannel;
}

/**
 * Listen for new incidents
 */
export function onNewIncident(callback: (incident: Incident) => void) {
  const channel = subscribeToIncidents();
  
  if (!channel) {
    console.error('❌ Cannot listen: Channel not available');
    return () => {}; // Return empty cleanup function
  }

  console.log('👂 Listening for new incidents...');
  
  channel.bind('new-incident', (incident: Incident) => {
    console.log('📬 New incident received:', incident.type, incident.location);
    callback(incident);
  });

  // Return cleanup function
  return () => {
    console.log('🔇 Stopped listening for incidents');
    channel.unbind('new-incident');
  };
}

/**
 * Unsubscribe from incidents channel
 */
export function unsubscribeFromIncidents() {
  if (incidentsChannel) {
    console.log('🔌 Unsubscribing from incidents channel...');
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
    console.log('🔌 Disconnecting Pusher...');
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
    console.log('📡 Broadcasting incident via API...');
    
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
    console.log('✅ Incident broadcasted successfully');
    return data;

  } catch (error) {
    console.error('❌ Failed to broadcast incident:', error);
    throw error;
  }
}

/**
 * Upload image to Firebase Storage (via API route)
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    console.log(`📤 Uploading image: ${file.name}`);
    
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
    console.log('✅ Image uploaded:', data.url);
    
    return data.url;

  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}
