/**
 * Google Places API Integration
 * Real-time data for restaurants, cafes, salons, spas, street food, etc.
 */

import { Place, Location } from './types';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Place types for various categories
export const PLACE_CATEGORIES = {
  // Food & Drink
  restaurant: { label: 'Restaurants', icon: '🍽️', types: ['restaurant'] },
  cafe: { label: 'Cafes', icon: '☕', types: ['cafe'] },
  street_food: { label: 'Street Food', icon: '🍜', types: ['meal_takeaway', 'food'] },
  bakery: { label: 'Bakeries', icon: '🥐', types: ['bakery'] },
  bar: { label: 'Bars & Pubs', icon: '🍺', types: ['bar', 'night_club'] },
  
  // Services
  hair_salon: { label: 'Hair Salons', icon: '💇', types: ['hair_care'] },
  spa: { label: 'Spas & Massage', icon: '💆', types: ['spa', 'beauty_salon'] },
  gym: { label: 'Gyms & Fitness', icon: '🏋️', types: ['gym'] },
  
  // Shopping & Entertainment
  shopping: { label: 'Shopping', icon: '🛍️', types: ['shopping_mall', 'clothing_store'] },
  convenience: { label: 'Convenience Stores', icon: '🏪', types: ['convenience_store'] },
  pharmacy: { label: 'Pharmacies', icon: '💊', types: ['pharmacy'] },
  movie: { label: 'Cinemas', icon: '🎬', types: ['movie_theater'] },
  
  // Tourism
  attraction: { label: 'Attractions', icon: '🎭', types: ['tourist_attraction'] },
  museum: { label: 'Museums', icon: '🏛️', types: ['museum'] },
  park: { label: 'Parks', icon: '🌳', types: ['park'] },
};

interface PlacesSearchParams {
  location: Location;
  radius?: number; // in meters, max 50000
  type?: string;
  keyword?: string;
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
  };
  price_level?: number;
}

/**
 * Search nearby places using Google Places API
 */
export async function searchNearbyPlaces(
  params: PlacesSearchParams
): Promise<Place[]> {
  const { location, radius = 5000, type, keyword } = params;

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', `${location.lat},${location.lng}`);
    url.searchParams.append('radius', radius.toString());
    if (type) url.searchParams.append('type', type);
    if (keyword) url.searchParams.append('keyword', keyword);
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    // Note: This needs to be called from backend due to CORS
    const response = await fetch(`/api/places/nearby?${url.searchParams}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map((place: GooglePlace) => convertGooglePlaceToPlace(place));
    }

    return [];
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

/**
 * Get place details by place_id
 */
export async function getPlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const response = await fetch(`/api/places/details?place_id=${placeId}`);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Convert Google Place to our Place interface
 */
function convertGooglePlaceToPlace(googlePlace: GooglePlace): Place {
  // Determine place type from Google types
  let placeType: Place['type'] = 'restaurant';
  if (googlePlace.types.includes('cafe')) placeType = 'cafe';
  else if (googlePlace.types.includes('museum')) placeType = 'museum';
  else if (googlePlace.types.includes('shopping_mall')) placeType = 'mall';
  else if (googlePlace.types.includes('tourist_attraction')) placeType = 'attraction';

  // Get photo URL if available
  let imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  if (googlePlace.photos && googlePlace.photos.length > 0) {
    imageUrl = getPhotoUrl(googlePlace.photos[0].photo_reference, 400);
  }

  return {
    id: googlePlace.place_id,
    name: googlePlace.name,
    type: placeType,
    location: {
      lat: googlePlace.geometry.location.lat,
      lng: googlePlace.geometry.location.lng,
      address: googlePlace.vicinity,
    },
    description: `${googlePlace.vicinity}${googlePlace.user_ratings_total ? ` • ${googlePlace.user_ratings_total} reviews` : ''}`,
    isIndoor: !googlePlace.types.includes('park') && !googlePlace.types.includes('beach'),
    rating: googlePlace.rating,
    imageUrl,
  };
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!GOOGLE_PLACES_API_KEY) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Search places by text query
 */
export async function searchPlacesByText(
  query: string,
  location?: Location
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query,
      key: GOOGLE_PLACES_API_KEY,
    });

    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
      params.append('radius', '10000');
    }

    const response = await fetch(`/api/places/textsearch?${params}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map((place: GooglePlace) => convertGooglePlaceToPlace(place));
    }

    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Get popular places in Da Nang by category
 */
export async function getPopularPlacesByCategory(
  category: keyof typeof PLACE_CATEGORIES,
  location: Location = { lat: 16.0544, lng: 108.2022 }
): Promise<Place[]> {
  const categoryConfig = PLACE_CATEGORIES[category];
  if (!categoryConfig) return [];

  const allPlaces: Place[] = [];

  // Search for each type in the category
  for (const type of categoryConfig.types) {
    const places = await searchNearbyPlaces({
      location,
      radius: 5000,
      type,
    });
    allPlaces.push(...places);
  }

  // Remove duplicates and sort by rating
  const uniquePlaces = Array.from(
    new Map(allPlaces.map(place => [place.id, place])).values()
  );

  return uniquePlaces
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
}

/**
 * Enhanced search with Vietnamese keywords
 */
export async function searchDaNangPlaces(
  query: string,
  userLocation?: Location
): Promise<Place[]> {
  const location = userLocation || { lat: 16.0544, lng: 108.2022 };

  // Translate common Vietnamese terms to English for better results
  const translations: Record<string, string> = {
    'quán ăn': 'restaurant',
    'quán cà phê': 'cafe',
    'quán cafe': 'cafe',
    'tiệm cắt tóc': 'hair salon',
    'salon tóc': 'hair salon',
    'spa': 'spa massage',
    'mát xa': 'massage spa',
    'tiệm nail': 'nail salon',
    'phòng gym': 'gym fitness',
    'rạp phim': 'cinema movie theater',
    'siêu thị': 'supermarket',
    'cửa hàng tiện lợi': 'convenience store',
    'hiệu thuốc': 'pharmacy',
    'bệnh viện': 'hospital',
    'ăn vặt': 'street food snack',
    'đồ ăn đường phố': 'street food',
    'quán nhậu': 'bar pub',
    'karaoke': 'karaoke',
  };

  // Find matching translation or use original query
  let searchQuery = query.toLowerCase();
  for (const [vietnamese, english] of Object.entries(translations)) {
    if (searchQuery.includes(vietnamese)) {
      searchQuery = searchQuery.replace(vietnamese, english);
      break;
    }
  }

  // Add "Da Nang" to query for better location context
  searchQuery = `${searchQuery} Da Nang Vietnam`;

  return searchPlacesByText(searchQuery, location);
}
