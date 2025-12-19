# Google Places API Integration Plan - GrabTheBeyond

**Mục đích:** Kế hoạch chi tiết tích hợp Google Places API để mở rộng database địa điểm và cải thiện trải nghiệm người dùng

---

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Tích Hợp](#kiến-trúc-tích-hợp)
3. [API Endpoints Sử Dụng](#api-endpoints-sử-dụng)
4. [Data Migration Strategy](#data-migration-strategy)
5. [Real-Time Sync Strategy](#real-time-sync-strategy)
6. [Cost Management](#cost-management)
7. [Implementation Timeline](#implementation-timeline)

---

## 🎯 Tổng Quan

### Mục Tiêu

- **Mở rộng database**: Từ 500+ lên hàng nghìn địa điểm
- **Cập nhật real-time**: Giờ mở cửa, đánh giá, trạng thái
- **Tìm kiếm nâng cao**: Autocomplete, Nearby Search, Text Search
- **Tích hợp Travel Planner**: Gợi ý địa điểm thông minh hơn

### Lợi Ích

- ✅ Dữ liệu địa điểm phong phú và cập nhật
- ✅ Tìm kiếm nhanh và chính xác
- ✅ Thông tin chi tiết (giờ mở cửa, đánh giá, ảnh)
- ✅ Tích hợp với Google Maps
- ✅ Giảm công sức maintain database thủ công

---

## 🏗️ Kiến Trúc Tích Hợp

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js App)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Travel Planner Form                                   │  │
│  │  - AI Chatbot                                            │  │
│  │  - Place Search Component                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/places/autocomplete                                │  │
│  │  /api/places/search                                       │  │
│  │  /api/places/details                                      │  │
│  │  /api/places/nearby                                       │  │
│  │  /api/places/sync                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Google     │    │   Firebase   │    │   Redis      │
│   Places API │    │   Firestore  │    │   Cache      │
│              │    │              │    │              │
│  - Autocomplete│  │  - places    │    │  - API       │
│  - Details    │  │    collection │    │    responses │
│  - Nearby     │  │  - Sync logs  │    │  - Search    │
│  - Search     │  │  - Metadata   │    │    results   │
│  - Photos     │  │               │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                             │
│                                                                  │
│  User Search Request                                            │
│         │                                                        │
│         ▼                                                        │
│  Check Redis Cache                                              │
│         │                                                        │
│         ├─→ Cache Hit → Return Cached Data                      │
│         │                                                        │
│         └─→ Cache Miss                                          │
│                  │                                               │
│                  ▼                                               │
│         Check Firestore (Local DB)                              │
│                  │                                               │
│                  ├─→ Found → Return + Update Cache              │
│                  │                                               │
│                  └─→ Not Found                                   │
│                           │                                      │
│                           ▼                                      │
│                  Call Google Places API                         │
│                           │                                      │
│                           ▼                                      │
│                  Save to Firestore                               │
│                           │                                      │
│                           ▼                                      │
│                  Update Redis Cache                              │
│                           │                                      │
│                           ▼                                      │
│                  Return to User                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints Sử Dụng

### 1. Places Autocomplete API

**Use Case:** Tìm kiếm địa điểm khi người dùng gõ

```javascript
// API Route: /api/places/autocomplete
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const location = searchParams.get('location'); // lat,lng
  
  // Check cache first
  const cacheKey = `autocomplete:${input}:${location}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));
  
  // Call Google Places API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
    `input=${encodeURIComponent(input)}&` +
    `location=${location}&` +
    `radius=50000&` + // 50km radius
    `language=vi&` +
    `key=${GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(data));
  
  return NextResponse.json(data);
}
```

**Response Format:**
```json
{
  "predictions": [
    {
      "place_id": "ChIJ...",
      "description": "Bà Nà Hills, Hòa Vang, Đà Nẵng",
      "structured_formatting": {
        "main_text": "Bà Nà Hills",
        "secondary_text": "Hòa Vang, Đà Nẵng"
      }
    }
  ]
}
```

### 2. Place Details API

**Use Case:** Lấy thông tin chi tiết về một địa điểm

```javascript
// API Route: /api/places/details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');
  
  // Check Firestore first
  const cached = await getPlaceFromFirestore(placeId);
  if (cached && isRecent(cached.lastUpdated)) {
    return NextResponse.json(cached);
  }
  
  // Call Google Places API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${placeId}&` +
    `fields=name,formatted_address,geometry,rating,user_ratings_total,` +
    `opening_hours,photos,types,price_level,website,phone_number&` +
    `language=vi&` +
    `key=${GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  
  // Save to Firestore
  await savePlaceToFirestore(placeId, data.result);
  
  return NextResponse.json(data.result);
}
```

**Response Fields:**
- `name`: Tên địa điểm
- `formatted_address`: Địa chỉ đầy đủ
- `geometry.location`: Tọa độ (lat, lng)
- `rating`: Đánh giá (1-5)
- `user_ratings_total`: Số lượt đánh giá
- `opening_hours`: Giờ mở cửa
- `photos`: Mảng ảnh
- `types`: Loại địa điểm (restaurant, tourist_attraction, etc.)
- `price_level`: Mức giá (0-4)
- `website`: Website
- `phone_number`: Số điện thoại

### 3. Nearby Search API

**Use Case:** Tìm địa điểm gần vị trí người dùng

```javascript
// API Route: /api/places/nearby
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '5000'; // meters
  const type = searchParams.get('type'); // restaurant, cafe, etc.
  
  const cacheKey = `nearby:${lat}:${lng}:${radius}:${type}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
    `location=${lat},${lng}&` +
    `radius=${radius}&` +
    `type=${type}&` +
    `language=vi&` +
    `key=${GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  
  // Cache for 30 minutes
  await redis.setex(cacheKey, 1800, JSON.stringify(data));
  
  return NextResponse.json(data);
}
```

### 4. Text Search API

**Use Case:** Tìm kiếm địa điểm bằng từ khóa

```javascript
// API Route: /api/places/search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const location = searchParams.get('location'); // lat,lng
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
    `query=${encodeURIComponent(query)}&` +
    `location=${location}&` +
    `radius=50000&` +
    `language=vi&` +
    `key=${GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

### 5. Place Photos API

**Use Case:** Lấy ảnh của địa điểm

```javascript
// API Route: /api/places/photo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const photoReference = searchParams.get('photo_reference');
  const maxWidth = searchParams.get('maxwidth') || '400';
  
  // Google Places Photos API returns image directly
  const photoUrl = 
    `https://maps.googleapis.com/maps/api/place/photo?` +
    `maxwidth=${maxWidth}&` +
    `photo_reference=${photoReference}&` +
    `key=${GOOGLE_PLACES_API_KEY}`;
  
  // Proxy through our server to add caching
  const response = await fetch(photoUrl);
  const imageBuffer = await response.arrayBuffer();
  
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400' // 1 day
    }
  });
}
```

---

## 🔄 Data Migration Strategy

### Phase 1: Enrich Existing Data

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION WORKFLOW                           │
│                                                                  │
│  Step 1: Match Existing Places                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  For each place in danang-places-data.json:             │  │
│  │    1. Search Google Places by name + location           │  │
│  │    2. Match by distance (< 100m)                        │  │
│  │    3. Get place_id                                       │  │
│  │    4. Fetch full details                                 │  │
│  │    5. Merge data (keep our custom fields)                │  │
│  │    6. Update Firestore                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 2: Add Missing Fields                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - opening_hours (from Google)                           │  │
│  │  - current_opening_hours_status                          │  │
│  │  - photos (high quality from Google)                      │  │
│  │  - user_ratings_total                                     │  │
│  │  - price_level                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 3: Add New Places                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Search for popular places in Da Nang                  │  │
│  │  - Filter by rating (> 4.0)                              │  │
│  │  - Add to database                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Firestore Schema Update

```typescript
interface Place {
  // Existing fields
  id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
  category: string;
  rating: number;
  description: string;
  
  // New fields from Google Places
  place_id: string; // Google Places ID
  google_rating: number;
  user_ratings_total: number;
  opening_hours: {
    open_now: boolean;
    weekday_text: string[];
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
  photos: Array<{
    photo_reference: string;
    width: number;
    height: number;
    url?: string; // Cached URL
  }>;
  types: string[]; // Google Places types
  price_level: number; // 0-4
  website?: string;
  phone_number?: string;
  formatted_address: string;
  
  // Metadata
  source: 'google' | 'manual' | 'merged';
  last_synced: Timestamp;
  sync_frequency: 'daily' | 'weekly' | 'monthly';
}
```

---

## 🔄 Real-Time Sync Strategy

### Sync Frequency

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC STRATEGY                                  │
│                                                                  │
│  High Priority (Daily):                                          │
│  - Popular places (rating > 4.5, > 1000 reviews)                 │
│  - Places in travel plans                                        │
│  - Recently searched places                                      │
│                                                                  │
│  Medium Priority (Weekly):                                       │
│  - All places with place_id                                     │
│  - Places with opening_hours                                     │
│                                                                  │
│  Low Priority (Monthly):                                         │
│  - All other places                                             │
│  - Inactive places                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Background Sync Job

```javascript
// Scheduled job (Cron: Daily at 2 AM)
export async function syncPlaces() {
  const places = await getPlacesToSync();
  
  for (const place of places) {
    try {
      // Fetch latest data from Google
      const details = await fetchPlaceDetails(place.place_id);
      
      // Update only changed fields
      const updates = {
        google_rating: details.rating,
        user_ratings_total: details.user_ratings_total,
        opening_hours: details.opening_hours,
        last_synced: Timestamp.now()
      };
      
      await updatePlace(place.id, updates);
      
      // Rate limiting: 1 request per second
      await sleep(1000);
    } catch (error) {
      logger.error(`Failed to sync place ${place.id}:`, error);
    }
  }
}
```

---

## 💰 Cost Management

### API Pricing (Google Places API - New)

- **Autocomplete (per session)**: $2.83 per 1,000 sessions
- **Place Details**: $17 per 1,000 requests
- **Nearby Search**: $32 per 1,000 requests
- **Text Search**: $32 per 1,000 requests
- **Place Photos**: $7 per 1,000 requests

### Cost Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                    COST OPTIMIZATION                             │
│                                                                  │
│  Strategy 1: Aggressive Caching                                 │
│  - Cache Autocomplete: 1 hour                                   │
│  - Cache Place Details: 24 hours                                │
│  - Cache Nearby Search: 30 minutes                              │
│  - Cache Photos: 7 days                                         │
│  - Estimated savings: 70-80% of API calls                       │
│                                                                  │
│  Strategy 2: Batch Operations                                    │
│  - Group multiple place details requests                        │
│  - Use Place Details (New) with multiple place_ids             │
│  - Estimated savings: 20-30%                                    │
│                                                                  │
│  Strategy 3: Smart Sync Frequency                                │
│  - Only sync active/popular places frequently                  │
│  - Lazy load details on demand                                  │
│  - Estimated savings: 50-60% of sync costs                      │
│                                                                  │
│  Strategy 4: Use Firestore as Primary Source                     │
│  - Query Firestore first, Google API as fallback               │
│  - Only call API when data is stale or missing                  │
│  - Estimated savings: 40-50%                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Monthly Cost Estimation

**Scenario: 10,000 active users/month**

- Autocomplete: 50,000 sessions/month = $141.50
- Place Details: 20,000 requests/month = $340
- Nearby Search: 10,000 requests/month = $320
- Text Search: 5,000 requests/month = $160
- Photos: 30,000 requests/month = $210

**Total: ~$1,171/month**

**With Optimization (70% reduction): ~$351/month**

---

## 📅 Implementation Timeline

### Phase 1: Setup & Basic Integration (Week 1-2)

- [ ] Setup Google Cloud Platform account
- [ ] Enable Places API (New)
- [ ] Create API keys và setup quotas
- [ ] Implement basic Autocomplete endpoint
- [ ] Setup Redis caching
- [ ] Test với small dataset

### Phase 2: Data Migration (Week 3-4)

- [ ] Build migration script
- [ ] Match existing 500+ places với Google Places
- [ ] Enrich data với Google Places details
- [ ] Update Firestore schema
- [ ] Validate data quality

### Phase 3: Full Integration (Week 5-6)

- [ ] Implement all API endpoints
- [ ] Integrate với Travel Planner
- [ ] Integrate với AI Chatbot
- [ ] Add photo caching
- [ ] Setup background sync jobs

### Phase 4: Optimization & Testing (Week 7-8)

- [ ] Performance testing
- [ ] Cost optimization
- [ ] Error handling & fallbacks
- [ ] User acceptance testing
- [ ] Documentation

### Phase 5: Production Deployment (Week 9)

- [ ] Deploy to production
- [ ] Monitor API usage & costs
- [ ] Gather user feedback
- [ ] Iterate & improve

---

## 🔒 Security & Best Practices

### API Key Security

- Store API keys in environment variables
- Use different keys for different environments
- Enable API key restrictions (HTTP referrer, IP)
- Rotate keys regularly
- Monitor usage for anomalies

### Rate Limiting

- Implement per-user rate limits
- Use exponential backoff for retries
- Queue requests when rate limit hit
- Monitor và alert on high usage

### Error Handling

- Graceful fallback to cached data
- Retry với exponential backoff
- Log errors for monitoring
- User-friendly error messages

---

**Cập nhật lần cuối:** December 2025




