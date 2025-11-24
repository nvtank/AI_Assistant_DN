export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Incident {
  id?: string;
  type: 'flooding' | 'pothole' | 'construction' | 'traffic';
  location: Location;
  description: string;
  imageUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  severity: 'low' | 'medium' | 'high';
  createdAt: any;
  reportedBy?: string;
  verifiedAt?: any;
  verifiedBy?: string;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  main: string;
  wind_speed: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Place {
  id: string;
  name: string;
  type: 'museum' | 'cafe' | 'restaurant' | 'attraction' | 'mall';
  location: Location;
  description: string;
  distance?: number;
  isIndoor: boolean;
  rating?: number;
  imageUrl?: string;
}

export const INCIDENT_TYPES = {
  flooding: {
    label: 'Flooding',
    icon: '🌊',
    color: '#3b82f6',
  },
  pothole: {
    label: 'Pothole',
    icon: '🕳️',
    color: '#f59e0b',
  },
  construction: {
    label: 'Construction',
    icon: '🚧',
    color: '#ef4444',
  },
  traffic: {
    label: 'Traffic Jam',
    icon: '🚗',
    color: '#8b5cf6',
  },
};

export const SEVERITY_LEVELS = {
  low: {
    label: 'Low',
    color: '#10b981',
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
  },
  high: {
    label: 'Critical',
    color: '#ef4444',
  },
};

// Default location: Da Nang city center (when all location methods fail)
export const DA_NANG_CENTER: Location = {
  lat: 16.0544,
  lng: 108.2022,
  address: 'Da Nang, Vietnam'
};

// Real Da Nang places data with accurate coordinates
export const MOCK_PLACES: Place[] = [
  // Museums
  {
    id: '1',
    name: 'Cham Museum (Bảo tàng Chăm)',
    type: 'museum',
    location: { lat: 16.0611, lng: 108.2228, address: '2 Tháng 9 Street, Bình Hiên, Hải Châu' },
    description: 'The largest Cham sculpture museum in the world with over 300 artifacts from the 7th-15th centuries',
    isIndoor: true,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Da Nang Museum (Bảo tàng Đà Nẵng)',
    type: 'museum',
    location: { lat: 16.0686, lng: 108.2234, address: '24 Trần Phú, Thạch Thang, Hải Châu' },
    description: 'Modern museum showcasing Da Nang history, culture and revolution with 2,500+ exhibits',
    isIndoor: true,
    rating: 4.3,
    imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&h=300&fit=crop',
  },

  // Cafes & Restaurants
  {
    id: '3',
    name: 'Cong Caphe Tran Phu',
    type: 'cafe',
    location: { lat: 16.0678, lng: 108.2208, address: '216 Trần Phú, Phước Ninh, Hải Châu' },
    description: 'Famous Vietnamese retro-style cafe chain with coconut coffee specialty and beach view',
    isIndoor: true,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f6?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'The Coffee House - Bach Dang',
    type: 'cafe',
    location: { lat: 16.0613, lng: 108.2246, address: '150-152 Bạch Đằng, Hải Châu 1, Hải Châu' },
    description: 'Modern Vietnamese coffee chain with Han River view, free WiFi and comfortable workspace',
    isIndoor: true,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Madame Lan Restaurant',
    type: 'restaurant',
    location: { lat: 16.0695, lng: 108.2242, address: '4 Bạch Đằng, Thạch Thang, Hải Châu' },
    description: 'Upscale Vietnamese cuisine with riverside view, specializing in seafood and traditional dishes',
    isIndoor: true,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Bun Cha Ca 83',
    type: 'restaurant',
    location: { lat: 16.0472, lng: 108.2194, address: '83 Hùng Vương, Thạch Thang, Hải Châu' },
    description: 'Authentic Da Nang fish cake noodle soup, local favorite since 1980s',
    isIndoor: true,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
  },

  // Shopping Malls
  {
    id: '7',
    name: 'Vincom Plaza Da Nang',
    type: 'mall',
    location: { lat: 16.0685, lng: 108.2206, address: '910A Ngô Quyền, An Hải Bắc, Sơn Trà' },
    description: 'Large modern shopping mall with international brands, cinema, food court and ice skating rink',
    isIndoor: true,
    rating: 4.4,
    imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    name: 'Lotte Mart Da Nang',
    type: 'mall',
    location: { lat: 16.0740, lng: 108.2238, address: '6 Nại Nam, Hòa Cường Bắc, Hải Châu' },
    description: 'Korean hypermarket with groceries, electronics, fashion and rooftop food court',
    isIndoor: true,
    rating: 4.3,
    imageUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&h=300&fit=crop',
  },
  {
    id: '9',
    name: 'Han Market (Chợ Hàn)',
    type: 'mall',
    location: { lat: 16.0683, lng: 108.2211, address: '119 Trần Phú, Hải Châu 1, Hải Châu' },
    description: 'Traditional central market with fresh produce, local food, souvenirs and fabric since 1940',
    isIndoor: true,
    rating: 4.2,
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop',
  },

  // Beaches & Attractions
  {
    id: '10',
    name: 'My Khe Beach (Bãi biển Mỹ Khê)',
    type: 'attraction',
    location: { lat: 16.0399, lng: 108.2474, address: 'Phước Mỹ, Sơn Trà' },
    description: 'Named one of the most beautiful beaches by Forbes, 7km white sand with clear blue water',
    isIndoor: false,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
  },
  {
    id: '11',
    name: 'Dragon Bridge (Cầu Rồng)',
    type: 'attraction',
    location: { lat: 16.0606, lng: 108.2275, address: 'Trần Hưng Đạo, Sơn Trà' },
    description: 'Iconic 666m bridge shaped like a dragon, breathes fire & water every Sat-Sun 9PM',
    isIndoor: false,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop',
  },
  {
    id: '12',
    name: 'Marble Mountains (Ngũ Hành Sơn)',
    type: 'attraction',
    location: { lat: 16.0019, lng: 108.2627, address: 'Hòa Hải, Ngũ Hành Sơn' },
    description: 'Five marble and limestone hills with caves, Buddhist temples and panoramic city views',
    isIndoor: false,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop',
  },
  {
    id: '13',
    name: 'Ba Na Hills (Sun World Ba Na Hills)',
    type: 'attraction',
    location: { lat: 15.9953, lng: 107.9975, address: 'Hòa Ninh, Hòa Vang' },
    description: 'Mountain resort at 1,487m with Golden Bridge, French Village, cable car and amusement park',
    isIndoor: false,
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop',
  },
  {
    id: '14',
    name: 'Son Tra Peninsula (Bán đảo Sơn Trà)',
    type: 'attraction',
    location: { lat: 16.1066, lng: 108.2683, address: 'Thọ Quang, Sơn Trà' },
    description: 'Nature reserve with pristine beaches, jungle trails, Linh Ung Pagoda and rare red-shanked doucs',
    isIndoor: false,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
  {
    id: '15',
    name: 'Linh Ung Pagoda - Son Tra',
    type: 'attraction',
    location: { lat: 16.1072, lng: 108.2781, address: 'Bãi Bụt, Thọ Quang, Sơn Trà' },
    description: 'Buddhist temple with 67m tall Lady Buddha statue, largest in Vietnam, stunning sea views',
    isIndoor: false,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop',
  },
  {
    id: '16',
    name: 'Han River Bridge (Cầu Sông Hàn)',
    type: 'attraction',
    location: { lat: 16.0703, lng: 108.2276, address: 'Bạch Đằng, Hải Châu' },
    description: 'First rotating bridge in Vietnam, opens at midnight for ships to pass through',
    isIndoor: false,
    rating: 4.4,
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop',
  },
  {
    id: '17',
    name: 'Love Lock Bridge (Cầu Tình Yêu)',
    type: 'attraction',
    location: { lat: 16.0613, lng: 108.2270, address: 'Trần Hưng Đạo, Hải Châu' },
    description: 'Romantic pedestrian bridge over Han River decorated with love locks from couples',
    isIndoor: false,
    rating: 4.3,
    imageUrl: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=400&h=300&fit=crop',
  },
  {
    id: '18',
    name: 'Pham Van Dong Beach',
    type: 'attraction',
    location: { lat: 16.0909, lng: 108.2599, address: 'Phạm Văn Đồng, Sơn Trà' },
    description: 'Less crowded beach with crystal clear water, perfect for swimming and water sports',
    isIndoor: false,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: '19',
    name: 'Asia Park Da Nang',
    type: 'attraction',
    location: { lat: 16.0377, lng: 108.2149, address: '1 Phan Đăng Lưu, Hòa Cường Bắc, Hải Châu' },
    description: 'Amusement park with 115m Sun Wheel (largest Ferris wheel in Vietnam) and Asian cultural zones',
    isIndoor: false,
    rating: 4.4,
    imageUrl: 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=400&h=300&fit=crop',
  },
  {
    id: '20',
    name: 'Helio Center Da Nang',
    type: 'mall',
    location: { lat: 16.0828, lng: 108.2236, address: '96-98 Nguyễn Tri Phương, Hòa Thuận Tây, Hải Châu' },
    description: 'Modern shopping and entertainment complex with night market, restaurants and events',
    isIndoor: true,
    rating: 4.2,
    imageUrl: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop',
  },
];
