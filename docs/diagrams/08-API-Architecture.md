# API Architecture

## 🔌 RESTful API & WebSocket Architecture

Tài liệu chi tiết về các API endpoints, request/response formats, và WebSocket events.

---

## 📊 API Overview

```mermaid
graph TB
    subgraph "Client Applications"
        WEB[Web Client]
        MOBILE[Mobile Browser]
    end

    subgraph "API Gateway Layer"
        NEXT_API[Next.js API Routes<br/>/api/*]
        EXPRESS_API[Express REST API<br/>Port 3001]
    end

    subgraph "Service Layer"
        AUTH[Auth Service]
        INCIDENT[Incident Service]
        TRAVEL[Travel Service]
        AI[AI Service]
        PLACES[Places Service]
    end

    subgraph "Real-time Layer"
        SOCKET[Socket.IO Server<br/>WebSocket]
    end

    subgraph "Data Layer"
        FIRESTORE[(Firestore)]
        STORAGE[(Storage)]
    end

    subgraph "External APIs"
        GEMINI_API[Gemini AI]
        PLACES_API[Google Places]
        WEATHER_API[OpenWeather]
        GEOCODE_API[Nominatim]
    end

    WEB --> NEXT_API
    MOBILE --> NEXT_API
    WEB -.WebSocket.-> SOCKET
    MOBILE -.WebSocket.-> SOCKET

    NEXT_API --> EXPRESS_API
    NEXT_API --> AUTH
    NEXT_API --> INCIDENT
    NEXT_API --> TRAVEL
    NEXT_API --> AI

    EXPRESS_API --> SOCKET
    
    AUTH --> FIRESTORE
    INCIDENT --> FIRESTORE
    TRAVEL --> FIRESTORE
    INCIDENT --> STORAGE
    
    AI --> GEMINI_API
    TRAVEL --> PLACES_API
    NEXT_API --> WEATHER_API
    NEXT_API --> GEOCODE_API

    style NEXT_API fill:#000,color:#fff,stroke:#fff,stroke-width:2px
    style SOCKET fill:#010101,color:#00ff00,stroke:#00ff00,stroke-width:2px
    style FIRESTORE fill:#FFA611,stroke:#333,stroke-width:2px
```

---

## 🌐 API Endpoints Reference

### Base URLs:
- **Frontend/Next.js API**: `https://grabthebeyond.vercel.app/api`
- **Backend/Express**: `https://grabthebeyond-backend.railway.app`
- **WebSocket**: `wss://grabthebeyond-backend.railway.app`

---

## 1️⃣ Authentication API

### POST `/api/auth/login`

**Description**: Authenticate user with email and password

**Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "uid": "abc123xyz",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user",
    "photoURL": "https://..."
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### POST `/api/auth/signup`

**Description**: Register new user account

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "strongPass123!",
  "displayName": "Jane Smith"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "uid": "def456uvw",
    "email": "newuser@example.com",
    "displayName": "Jane Smith",
    "role": "user"
  },
  "message": "Account created successfully"
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Min 8 characters, 1 uppercase, 1 number
- Display Name: 2-50 characters

---

### POST `/api/auth/logout`

**Description**: Log out current user

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2️⃣ Incident Management API

### GET `/api/incidents`

**Description**: Fetch incidents with optional filters

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: pending, verified, resolved |
| `category` | string | No | Filter by category: accident, flood, etc. |
| `limit` | number | No | Max results (default: 50) |
| `userId` | string | No | Filter by reporter |

**Request:**
```http
GET /api/incidents?status=verified&category=flood&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "incidents": [
    {
      "id": "incident_123",
      "userId": "user_abc",
      "userName": "John Doe",
      "title": "Flooding on Nguyen Van Linh Street",
      "description": "Heavy rain caused severe flooding...",
      "category": "flood",
      "severity": "high",
      "location": {
        "lat": 16.0544,
        "lng": 108.2022,
        "address": "123 Nguyen Van Linh, Da Nang"
      },
      "imageUrl": "https://res.cloudinary.com/...",
      "status": "verified",
      "reportedAt": "2025-12-16T10:30:00Z",
      "updatedAt": "2025-12-16T11:00:00Z",
      "viewCount": 45,
      "tags": ["urgent", "road", "traffic"]
    }
  ],
  "total": 15,
  "page": 1
}
```

---

### POST `/api/incidents`

**Description**: Report new incident

**Request:**
```json
{
  "title": "Road Construction on Tran Phu Street",
  "description": "Road repair work blocking 2 lanes",
  "category": "construction",
  "severity": "medium",
  "location": {
    "lat": 16.0471,
    "lng": 108.2427
  },
  "imageUrl": "https://res.cloudinary.com/grabthebeyond/..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "incidentId": "incident_456",
  "message": "Incident reported successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

### PATCH `/api/incidents/:id`

**Description**: Update incident (Admin only)

**Request:**
```http
PATCH /api/incidents/incident_123
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "resolved",
  "resolvedAt": "2025-12-16T15:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Incident updated successfully"
}
```

---

### DELETE `/api/incidents/:id`

**Description**: Delete incident (Admin only)

**Request:**
```http
DELETE /api/incidents/incident_123
Authorization: Bearer {admin_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

---

## 3️⃣ Travel Planning API

### POST `/api/travel-plan/generate`

**Description**: Generate AI-powered travel itinerary

**Request:**
```json
{
  "days": 3,
  "budget": 5000000,
  "people": 2,
  "interests": ["beach", "food", "culture"],
  "startLocation": {
    "lat": 16.0544,
    "lng": 108.2022
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "planId": "plan_789",
  "travelPlan": {
    "id": "plan_789",
    "title": "3-Day Da Nang Beach & Culture Experience",
    "duration": 3,
    "totalCost": 4850000,
    "dailyCosts": [1600000, 1750000, 1500000],
    "dailyItineraries": [
      {
        "day": 1,
        "date": "2025-12-20",
        "theme": "Beach Relaxation",
        "activities": [
          {
            "id": "act_001",
            "name": "My Khe Beach",
            "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
            "category": "beach",
            "location": {
              "lat": 16.0471,
              "lng": 108.2427,
              "address": "My Khe Beach, Da Nang"
            },
            "timeSlot": "morning",
            "duration": 180,
            "estimatedCost": 0,
            "description": "Relax at one of the world's most beautiful beaches",
            "rating": 4.6,
            "photos": [
              "https://maps.googleapis.com/maps/api/place/photo?..."
            ],
            "tips": "Arrive early to avoid crowds. Bring sunscreen!"
          },
          {
            "id": "act_002",
            "name": "Seafood Restaurant Hai San",
            "placeId": "ChIJ...",
            "category": "restaurant",
            "timeSlot": "afternoon",
            "duration": 90,
            "estimatedCost": 800000,
            "rating": 4.4
          }
        ]
      }
    ],
    "createdAt": "2025-12-16T12:00:00Z",
    "metadata": {
      "generatedBy": "ai",
      "aiModel": "gemini-1.5-pro"
    }
  }
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "AI generation failed",
  "message": "Unable to generate travel plan. Please try again."
}
```

---

### GET `/api/travel-plan/list`

**Description**: Get user's travel plans

**Query Parameters:**
- `userId`: string (required)
- `status`: string (optional): draft, published, completed

**Request:**
```http
GET /api/travel-plan/list?userId=user_abc&status=published
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "travelPlans": [
    {
      "id": "plan_789",
      "title": "3-Day Da Nang Beach Experience",
      "duration": 3,
      "budget": 5000000,
      "status": "published",
      "createdAt": "2025-12-16T12:00:00Z"
    }
  ],
  "total": 5
}
```

---

## 4️⃣ AI Chatbot API

### POST `/api/chat/send`

**Description**: Send message to AI chatbot

**Request:**
```json
{
  "message": "What are the best beaches in Da Nang?",
  "context": {
    "userLocation": {
      "lat": 16.0544,
      "lng": 108.2022
    },
    "sessionId": "session_abc123"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "Da Nang has several beautiful beaches! Here are the top 3:\n\n1. **My Khe Beach** - One of the world's most beautiful beaches...\n2. **Non Nuoc Beach** - Quieter beach perfect for relaxation...\n3. **Bac My An Beach** - Great for water sports...",
    "places": [
      {
        "placeId": "ChIJ...",
        "name": "My Khe Beach",
        "rating": 4.6,
        "userRatingsTotal": 12543,
        "photos": ["https://..."],
        "location": {
          "lat": 16.0471,
          "lng": 108.2427
        }
      }
    ],
    "metadata": {
      "model": "gemini-1.5-pro",
      "tokensUsed": 250,
      "latency": 1850
    }
  }
}
```

---

## 5️⃣ Places & Weather API

### POST `/api/geocode`

**Description**: Reverse geocode coordinates to address

**Request:**
```json
{
  "lat": 16.0544,
  "lng": 108.2022
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "address": "123 Nguyen Van Linh, Hai Chau District, Da Nang, Vietnam",
  "city": "Da Nang",
  "country": "Vietnam"
}
```

---

### GET `/api/weather`

**Description**: Get current weather for Da Nang

**Request:**
```http
GET /api/weather?city=DaNang
```

**Response (200 OK):**
```json
{
  "success": true,
  "weather": {
    "temperature": 28,
    "feelsLike": 30,
    "humidity": 75,
    "condition": "Partly Cloudy",
    "icon": "02d",
    "windSpeed": 12,
    "description": "Few clouds"
  },
  "timestamp": "2025-12-16T14:30:00Z"
}
```

---

## 6️⃣ File Upload API

### POST `/api/upload`

**Description**: Upload incident images

**Request:**
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="incident.jpg"
Content-Type: image/jpeg

{binary image data}
------WebKitFormBoundary--
```

**Response (200 OK):**
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/grabthebeyond/image/upload/v1234567890/incidents/abc123.jpg",
  "publicId": "incidents/abc123",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "size": 2456789
}
```

**Validation:**
- Max file size: 5 MB
- Allowed formats: JPEG, PNG, WebP
- Automatic image optimization

---

## 7️⃣ Online Users API

### POST `/api/users/offline`

**Description**: Mark user as offline (called via sendBeacon)

**Request:**
```json
{
  "userId": "user_abc123"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Note**: This endpoint is called automatically when user closes browser tab using `navigator.sendBeacon()`.

---

## 🔌 WebSocket Events (Socket.IO)

### Client → Server Events

#### `incident:report`
**Description**: Report new incident via WebSocket

**Payload:**
```json
{
  "type": "incident:report",
  "data": {
    "title": "Traffic accident on Vo Nguyen Giap",
    "location": { "lat": 16.06, "lng": 108.24 }
  }
}
```

---

#### `user:join`
**Description**: User joins real-time room

**Payload:**
```json
{
  "type": "user:join",
  "userId": "user_abc123",
  "userName": "John Doe"
}
```

---

### Server → Client Events

#### `incident:new`
**Description**: Broadcast new incident to all connected clients

**Payload:**
```json
{
  "event": "incident:new",
  "data": {
    "id": "incident_999",
    "title": "Road construction on Beach Road",
    "location": { "lat": 16.05, "lng": 108.22 },
    "severity": "medium",
    "reportedAt": "2025-12-16T15:00:00Z"
  }
}
```

**Client Handler:**
```typescript
socket.on('incident:new', (data) => {
  console.log('New incident:', data);
  addMarkerToMap(data);
  showNotification('New incident reported nearby!');
});
```

---

#### `incident:update`
**Description**: Broadcast incident status change

**Payload:**
```json
{
  "event": "incident:update",
  "data": {
    "id": "incident_123",
    "status": "resolved",
    "updatedAt": "2025-12-16T16:00:00Z"
  }
}
```

---

#### `user:count`
**Description**: Broadcast online users count

**Payload:**
```json
{
  "event": "user:count",
  "count": 42
}
```

---

## 📋 API Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | External API failure |

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure:
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "uid": "user_abc123",
    "email": "user@example.com",
    "role": "user",
    "iat": 1702742400,
    "exp": 1702746000
  }
}
```

### Request Headers:
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 📊 Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/api/auth/*` | 10 requests | 1 minute |
| `/api/incidents` (POST) | 5 requests | 5 minutes |
| `/api/chat/send` | 20 requests | 1 minute |
| `/api/travel-plan/generate` | 3 requests | 1 hour |
| All other endpoints | 100 requests | 1 minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702742460
```

---

## 🧪 API Testing Examples

### cURL Examples:

**1. Login:**
```bash
curl -X POST https://grabthebeyond.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

**2. Get Incidents:**
```bash
curl -X GET "https://grabthebeyond.vercel.app/api/incidents?status=verified&limit=10"
```

**3. Report Incident (with auth):**
```bash
curl -X POST https://grabthebeyond.vercel.app/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Incident",
    "description": "Testing API",
    "category": "other",
    "severity": "low",
    "location": {"lat": 16.05, "lng": 108.22}
  }'
```

---

## 📚 API Versioning

Current API Version: **v1** (implicit)

Future versioning strategy:
- URL-based: `/api/v2/incidents`
- Header-based: `Accept: application/vnd.grabthebeyond.v2+json`

---

## 🔍 API Monitoring

### Health Check Endpoints:

**Frontend Health:**
```http
GET /api/health
```

**Backend Health:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:00:00Z",
  "uptime": 3600,
  "services": {
    "firestore": "connected",
    "socketio": "running"
  }
}
```

---

**API Documentation Version**: 1.0  
**Last Updated**: December 2025  
**API Standard**: REST + WebSocket (Socket.IO)

