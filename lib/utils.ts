import { Location } from './types';

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
 * Get current user location with two-stage fallback
 * Stage 1: Try high accuracy (GPS) - best for outdoor
 * Stage 2: Try low accuracy (WiFi/Network) - faster, works indoor
 * Stage 3: Error - caller handles fallback to default location
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    console.log('🔍 Requesting geolocation with high accuracy...');

    // Stage 1: Try high accuracy (GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ High accuracy geolocation success:', position.coords);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('⚠️ High accuracy failed, trying low accuracy...', error.message);
        
        // Stage 2: Fallback to low accuracy (WiFi/Network)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Low accuracy geolocation success:', position.coords);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (fallbackError) => {
            let errorMessage = 'Unable to get your location';
            
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                console.error('❌ PERMISSION_DENIED');
                break;
              case fallbackError.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your GPS/network connection.';
                console.error('❌ POSITION_UNAVAILABLE - Possible reasons:');
                console.error('   1. GPS is turned off on your device');
                console.error('   2. No network connection');
                console.error('   3. Browser cannot determine location');
                console.error('   4. Using VPN/proxy that blocks location');
                break;
              case fallbackError.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                console.error('❌ TIMEOUT');
                break;
              default:
                console.error('❌ Unknown geolocation error:', fallbackError);
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocoding using Nominatim (OpenStreetMap)
 */
export async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    }
    return 'Địa chỉ không xác định';
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Lỗi lấy địa chỉ';
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
  // Mock Grab app link (internal demo app)
  const params = new URLSearchParams({
    pickup_latitude: fromLat.toString(),
    pickup_longitude: fromLng.toString(),
    dropoff_latitude: toLat.toString(),
    dropoff_longitude: toLng.toString(),
    dropoff_name: toName,
  });

  return `/mock-grab?${params.toString()}`;
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
