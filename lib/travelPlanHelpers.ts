/**
 * Helper functions for travel plan calculations
 */

/**
 * Add minutes to time string
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Subtract minutes from time string
 */
export function subtractMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + mins - minutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate travel time based on distance and transportation mode
 */
export function calculateTravelTime(
  distance: number,
  transportation: string = 'motorbike',
  time: string = '12:00'
): number {
  const speeds: { [key: string]: number } = {
    walking: 5,
    bicycle: 15,
    motorbike: 25,
    car: 30,
    taxi: 30,
    bus: 20,
  };

  let speed = speeds[transportation] || 25;

  // Check if it's rush hour (7-9 AM or 5-7 PM)
  const hour = parseInt(time.split(':')[0]);
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

  if (isRushHour) {
    speed *= 0.6;
  }

  // For long distances (>20km), assume highway speeds
  if (distance > 20) {
    speed = transportation === 'motorbike' ? 40 : 50;
  }

  const travelTimeMinutes = (distance / speed) * 60;
  const bufferTime = Math.ceil(distance / 10) * 5;
  
  return Math.ceil(travelTimeMinutes + bufferTime);
}

/**
 * Calculate Grab transport cost
 */
export function calculateGrabCost(distance: number, transportation: string = 'motorbike'): number {
  if (distance <= 0) return 0;

  // GrabBike: 11,500 VND/km
  if (transportation === 'motorbike' || transportation === 'bicycle') {
    return Math.round(distance * 11500);
  }

  // GrabCar: 22,000 VND (base 2km) + 12,000 VND/km after
  if (transportation === 'car' || transportation === 'taxi' || transportation === 'grab') {
    if (distance <= 2) {
      return 22000;
    }
    return Math.round(22000 + (distance - 2) * 12000);
  }

  // Mixed: Use average of bike and car
  if (transportation === 'mixed') {
    const bikeCost = distance * 11500;
    const carCost = distance <= 2 ? 22000 : 22000 + (distance - 2) * 12000;
    return Math.round((bikeCost + carCost) / 2);
  }

  return Math.round(distance * 11500);
}

