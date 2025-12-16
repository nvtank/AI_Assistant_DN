import { Location, DA_NANG_CENTER } from './types';
import { logger } from './logger';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Helper: Get location from IP address (Fallback for Desktop/Laptop without GPS)
 * Uses ip-api.com free API - Higher limits, no API key required
 * ALWAYS returns a valid location (Da Nang center if all else fails)
 */
async function getLocationFromIP(): Promise<Location> {
  try {
    logger.debug('Fetching location from IP address');
    
    // Use ipapi.co (free HTTPS API, 1000 requests/day, no key)
    const response = await fetch('https://ipapi.co/json/');
    
    // If API error or rate limit exceeded, return Da Nang center (safe fallback)
    if (!response.ok) {
      logger.warn(`IP API Error (${response.status}), using default Da Nang location`);
      return DA_NANG_CENTER;
    }
    
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      logger.debug('IP location success', { city: data.city, country: data.country_name });
      
      return {
        lat: data.latitude,
        lng: data.longitude,
        address: `${data.city}, ${data.country_name}`
      };
    }
    
    // API returned fail status, use Da Nang
    logger.warn('IP API failed to get location, using default Da Nang location');
    return DA_NANG_CENTER;

  } catch (error) {
    logger.warn('IP API connection error, using default Da Nang location', error);
    
    // CRITICAL: Always return a valid location instead of throwing error
    // This ensures the app never crashes due to location issues
    return DA_NANG_CENTER;
  }
}

/**
 * Get current user location with 4-stage fallback
 * Stage 1: Browser GPS (High accuracy) - Best for mobile devices
 * Stage 2: Browser Network Location (Low accuracy) - WiFi/Cell towers
 * Stage 3: IP Geolocation - For Desktop/Laptop without GPS
 * Stage 4: Da Nang Center - ALWAYS returns a valid location (never fails)
 * 
 * This function NEVER rejects - it always resolves with a valid location
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise(async (resolve) => {
    // Check if geolocation is not supported at all
    if (!navigator.geolocation) {
      logger.warn('Geolocation API not supported, trying IP location');
      const ipLocation = await getLocationFromIP();
      resolve(ipLocation); // getLocationFromIP() already handles fallback to DA_NANG_CENTER
      return;
    }

    logger.debug('Requesting geolocation (Stage 1: High accuracy GPS)');

    // Stage 1: Try high accuracy (GPS) - Best for mobile
    navigator.geolocation.getCurrentPosition(
      (position) => {
        logger.debug('GPS success (High accuracy)', { 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      async (error) => {
        logger.warn('GPS failed', { message: error.message });
        
        // Fallback to IP location if GPS fails
        logger.debug('Trying IP location as fallback');
        const ipLocation = await getLocationFromIP();
        resolve(ipLocation); // getLocationFromIP() already handles fallback to DA_NANG_CENTER
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout for GPS
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocoding using Nominatim (OpenStreetMap)
 * Uses Next.js API route to avoid CORS issues
 */
export async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  try {
    // Use Next.js API route to proxy the request (fixes CORS)
    const response = await fetch(
      `/api/geocode?lat=${lat}&lng=${lng}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocode API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.address) {
      return data.address;
    }
    return 'Address not available';
  } catch (error) {
    logger.error('Error getting address:', error);
    return 'Error getting address';
  }
}

/**
 * Generate Mock Grab app link (for demo purposes)
 */
export function generateMockGrabLink(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  toName: string
): string {
  // Build AppsFlyer OneLink that opens the Grab app to the destination
  // Requirements: keep signature, but use only toLat/toLng and toName

  const lat = toLat;
  const lng = toLng;
  const name = toName || '';

  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    logger.error('generateMockGrabLink: invalid destination coordinates');
    return '#';
  }

  // Step 1: internal deep link (must encode address)
  const encodedAddress = encodeURIComponent(name);
  const internalDeepLink = `grab://open?screenType=BOOKING&dropOffLatitude=${lat}&dropOffLongitude=${lng}&dropOffAddress=${encodedAddress}`;

  // Step 2: AppsFlyer OneLink wrapper (encode the entire internal link)
  const encodedPayload = encodeURIComponent(internalDeepLink);
  const oneLink = `https://grab.onelink.me/2695613898?pid=hackathon_ai_agent&c=booking_demo&is_retargeting=true&af_dp=${encodedPayload}`;

  return oneLink;
}

/**
 * Generate real Grab deep link (for production)
 */
export function generateGrabDeepLink(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  toName: string
): string {
  // Real Grab deep link format
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup_latitude: fromLat.toString(),
    pickup_longitude: fromLng.toString(),
    dropoff_latitude: toLat.toString(),
    dropoff_longitude: toLng.toString(),
    dropoff_name: toName,
  });

  return `grab://open?${params.toString()}`;
}

/**
 * Open Grab app (with mock fallback for demo)
 */
export function openGrabApp(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  toName: string,
  useMockApp: boolean = true // Default to mock for demo
): void {
  if (useMockApp) {
    // Use mock Grab app for demo
    const mockLink = generateMockGrabLink(fromLat, fromLng, toLat, toLng, toName);
    window.open(mockLink, '_blank');
  } else {
    // Use real Grab app (for production with proper permissions)
    const deepLink = generateGrabDeepLink(fromLat, fromLng, toLat, toLng, toName);
    
    // Try to open Grab app
    window.location.href = deepLink;

    // Fallback to web version after 2 seconds
    setTimeout(() => {
      const webUrl = `https://grab.onelink.me/2695613898?pid=website&c=SG-C01-WEB&af_dp=${encodeURIComponent(deepLink)}`;
      window.open(webUrl, '_blank');
    }, 2000);
  }
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
}
