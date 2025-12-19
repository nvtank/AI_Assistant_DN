# Future System Design - GrabTheBeyond

**Mục đích:** Sơ đồ kiến trúc hệ thống tương lai với tất cả các tính năng mới

---

## 📋 Mục Lục

1. [Kiến Trúc Tổng Quan](#kiến-trúc-tổng-quan)
2. [Component Architecture](#component-architecture)
3. [Data Architecture](#data-architecture)
4. [Integration Points](#integration-points)
5. [Security Architecture](#security-architecture)

---

## 🏗️ Kiến Trúc Tổng Quan

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Web App    │  │  Mobile Web  │  │   Admin      │  │   API        │  │
│  │  (Next.js)   │  │     (PWA)    │  │  Dashboard    │  │  Consumers   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │                 │
          └─────────────────┼─────────────────┼─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CDN & EDGE LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Vercel Edge Network (100+ locations)                                 │  │
│  │  - Static asset caching                                               │  │
│  │  - API response caching                                               │  │
│  │  - DDoS protection                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOAD BALANCER                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  - Health checks                                                      │  │
│  │  - SSL termination                                                   │  │
│  │  - Rate limiting                                                     │  │
│  │  - Request routing                                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Next.js     │    │  Next.js     │    │  Next.js     │
│  Instance 1  │    │  Instance 2  │    │  Instance 3  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  - Authentication                                                    │  │
│  │  - Authorization                                                     │  │
│  │  - Request validation                                                 │  │
│  │  - Rate limiting (per user, per IP)                                  │  │
│  │  - Request queuing                                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  API Service │    │  API Service │    │  API Service │
│  Instance 1  │    │  Instance 2  │    │  Instance 3  │
│  (Railway)   │    │  (Railway)   │    │  (Railway)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   AI Service │  │ Incident Svc  │  │ Travel Svc   │  │ Places Svc   │ │
│  │  (Gemini)    │  │  (Firebase)   │  │  (Gemini)     │  │  (Google)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Image Class. │  │  Auth Svc    │  │  Weather Svc  │  │  n8n Svc     │ │
│  │  (ML Model)  │  │  (Firebase)  │  │  (OpenWeather)│  │  (Workflows)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CACHING LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Redis Cluster (3 nodes)                                            │  │
│  │  - Weather data                                                     │  │
│  │  - Incident queries                                                 │  │
│  │  - Places data                                                       │  │
│  │  - User sessions                                                     │  │
│  │  - Rate limit counters                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MESSAGE QUEUE                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  RabbitMQ / Redis Queue                                             │  │
│  │  - incident_processing (high priority)                              │  │
│  │  - travel_plan_generation (normal priority)                         │  │
│  │  - image_classification (normal priority)                            │  │
│  │  - notifications (low priority)                                     │  │
│  │  - model_training (scheduled)                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Worker 1    │    │  Worker 2    │    │  Worker 3    │
│  (Background)│    │  (Background) │    │  (Background)│
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Firebase Firestore (Primary)                                        │  │
│  │  - users, incidents, travel_plans, chat_history                    │  │
│  │  - Auto-scaling, regional replication                               │  │
│  │                                                                      │  │
│  │  Redis (Cache + Sessions)                                           │  │
│  │  - Cluster mode, persistence                                        │  │
│  │                                                                      │  │
│  │  PostgreSQL (Analytics - Optional)                                 │  │
│  │  - Read replicas, time-series data                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Architecture

### Frontend Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENT ARCHITECTURE                │
│                                                                  │
│  App Layout                                                      │
│  ├── Header                                                      │
│  │   ├── UserMenu                                                │
│  │   ├── OnlineUsersCount                                        │
│  │   └── LanguageSelector                                        │
│  │                                                               │
│  ├── Main Content                                                │
│  │   ├── MapView (IncidentMap)                                  │
│  │   │   ├── MapLegend                                          │
│  │   │   ├── IncidentMarkers                                    │
│  │   │   └── ReportIncidentForm                                  │
│  │   │                                                          │
│  │   └── ChatView (AIChatbot)                                   │
│  │       ├── ChatMessages                                       │
│  │       ├── PlaceCards                                         │
│  │       ├── TravelPlannerChat                                  │
│  │       └── VoiceRecognition                                   │
│  │                                                               │
│  └── Sidebar                                                     │
│      ├── TravelPlanList                                         │
│      ├── SavedPlaces                                            │
│      └── Settings                                               │
│                                                                  │
│  Travel Planner                                                 │
│  ├── TravelPlannerForm                                          │
│  ├── PlanEditor (NEW)                                           │
│  │   ├── DayPlanEditor                                          │
│  │   ├── ActivityItem (Draggable)                               │
│  │   └── ConflictDetector                                       │
│  ├── TravelPlanSummary                                          │
│  └── TravelPlanViewer                                           │
│                                                                  │
│  Admin Dashboard                                                 │
│  ├── IncidentManagement                                         │
│  ├── UserManagement                                             │
│  ├── AnalyticsDashboard                                         │
│  └── ModelPerformance (NEW)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Services

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE ARCHITECTURE                  │
│                                                                  │
│  API Services (Next.js API Routes)                               │
│  ├── /api/auth/*                                                │
│  ├── /api/incidents/*                                           │
│  │   ├── /broadcast                                             │
│  │   └── /classify (NEW - AI classification)                   │
│  ├── /api/travel-plan/*                                         │
│  │   ├── /generate                                              │
│  │   ├── /list                                                  │
│  │   └── /update (NEW - plan editing)                           │
│  ├── /api/places/* (NEW)                                        │
│  │   ├── /autocomplete                                          │
│  │   ├── /details                                               │
│  │   ├── /nearby                                                │
│  │   └── /search                                                │
│  ├── /api/weather/*                                             │
│  └── /api/upload/*                                              │
│                                                                  │
│  Background Workers                                              │
│  ├── IncidentProcessor                                          │
│  │   ├── ImageClassification                                    │
│  │   ├── AutoVerification                                       │
│  │   └── NotificationSender                                     │
│  ├── TravelPlanGenerator                                         │
│  ├── PlacesSync (NEW)                                            │
│  └── ModelTrainer (NEW)                                         │
│                                                                  │
│  n8n Workflows                                                   │
│  ├── IncidentClassificationWorkflow                             │
│  ├── TravelPlanGenerationWorkflow                                │
│  └── ModelTrainingPipeline                                       │
│                                                                  │
│  Real-Time Services                                              │
│  ├── Socket.IO Server                                           │
│  │   ├── IncidentBroadcast                                       │
│  │   ├── OnlineUsersTracking                                    │
│  │   └── PlanUpdateNotifications                                │
│  └── Firestore Listeners                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Data Architecture

### Database Schema (Future)

```typescript
// Firestore Collections

// users (existing)
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  preferences: {
    language: 'en' | 'vi';
    autoSpeak: boolean;
    notifications: boolean;
  };
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// incidents (enhanced)
interface Incident {
  id: string;
  type: 'flooding' | 'traffic' | 'pothole' | 'construction';
  severity_level: 'low' | 'medium' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
    geohash: string; // For geospatial queries
  };
  description: string;
  imageUrl: string;
  status: 'pending' | 'verified' | 'rejected' | 'auto_verified'; // NEW
  verified: boolean;
  verifiedAt: Timestamp | null;
  verifiedBy: string | null; // 'admin' | 'ai' | null
  aiAnalysis: { // NEW
    type: string;
    severity: string;
    confidence: number;
    model_version: string;
    analysis_date: Timestamp;
  };
  user: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// travel_plans (enhanced)
interface TravelPlan {
  id: string;
  userId: string;
  request: TravelPlanRequest;
  days: DayPlan[];
  totalEstimatedCost: CostBreakdown;
  status: 'draft' | 'confirmed' | 'completed' | 'edited'; // NEW
  version: number; // NEW - for tracking edits
  editHistory: EditRecord[]; // NEW
  shared: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// places (NEW - from Google Places)
interface Place {
  id: string;
  place_id: string; // Google Places ID
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    formatted_address: string;
  };
  category: string;
  types: string[]; // Google Places types
  rating: number;
  google_rating: number;
  user_ratings_total: number;
  opening_hours: {
    open_now: boolean;
    weekday_text: string[];
    periods: Period[];
  };
  photos: Photo[];
  price_level: number;
  website?: string;
  phone_number?: string;
  source: 'google' | 'manual' | 'merged';
  last_synced: Timestamp;
  sync_frequency: 'daily' | 'weekly' | 'monthly';
}

// model_performance (NEW - for AI tracking)
interface ModelPerformance {
  model_version: string;
  date: Timestamp;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  predictions_count: number;
  auto_approved_count: number;
  false_positives: number;
  false_negatives: number;
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                              │
│                                                                  │
│  User Action                                                     │
│         │                                                        │
│         ▼                                                        │
│  API Request                                                     │
│         │                                                        │
│         ▼                                                        │
│  Check Cache (Redis)                                            │
│         │                                                        │
│         ├─→ Cache Hit → Return                                  │
│         │                                                        │
│         └─→ Cache Miss                                           │
│                  │                                               │
│                  ▼                                               │
│         Check Firestore                                          │
│                  │                                               │
│                  ├─→ Found → Return + Cache                       │
│                  │                                               │
│                  └─→ Not Found                                   │
│                           │                                      │
│                           ▼                                      │
│                  Call External API                               │
│                  (Google Places, Weather, etc.)                  │
│                           │                                      │
│                           ▼                                      │
│                  Save to Firestore                               │
│                           │                                      │
│                           ▼                                      │
│                  Update Cache                                    │
│                           │                                      │
│                           ▼                                      │
│                  Return to User                                  │
│                           │                                      │
│                           ▼                                      │
│                  Broadcast (if real-time)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Integration Points

### External Services

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICE INTEGRATIONS                  │
│                                                                  │
│  Google Services                                                 │
│  ├── Google Places API (New)                                     │
│  │   ├── Autocomplete                                            │
│  │   ├── Place Details                                            │
│  │   ├── Nearby Search                                            │
│  │   └── Text Search                                              │
│  ├── Google Gemini AI                                            │
│  │   ├── Chatbot                                                  │
│  │   └── Travel Plan Generation                                  │
│  └── Google Maps (Embedded)                                      │
│                                                                  │
│  Weather Services                                                │
│  └── OpenWeather API                                             │
│      └── Current & Forecast                                      │
│                                                                  │
│  ML/AI Services                                                  │
│  ├── Custom ML Model (Image Classification)                       │
│  │   └── Deployed on GPU server                                  │
│  └── n8n Workflows                                               │
│      ├── AI Classification                                       │
│      ├── Travel Plan Generation                                  │
│      └── Model Training                                          │
│                                                                  │
│  Communication Services                                          │
│  ├── Socket.IO (Real-time)                                       │
│  ├── Firebase Cloud Messaging (Push notifications)              │
│  └── Email Service (SendGrid/SES)                               │
│                                                                  │
│  Storage Services                                                │
│  ├── Firebase Storage (Images)                                   │
│  ├── Cloudinary (Image optimization)                            │
│  └── CDN (Vercel Edge)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Internal Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE COMMUNICATION                          │
│                                                                  │
│  Synchronous (HTTP/REST)                                         │
│  ├── Client → API Gateway → Services                            │
│  ├── Service → Service (direct calls)                           │
│  └── Service → External APIs                                    │
│                                                                  │
│  Asynchronous (Message Queue)                                    │
│  ├── Incident Processing                                        │
│  ├── Travel Plan Generation                                     │
│  ├── Image Classification                                        │
│  └── Notifications                                               │
│                                                                  │
│  Real-Time (WebSocket)                                          │
│  ├── Incident Broadcast                                          │
│  ├── Online Users                                                │
│  └── Plan Updates                                                │
│                                                                  │
│  Event-Driven (Pub/Sub)                                         │
│  ├── Firestore Triggers                                          │
│  ├── Cache Invalidation                                          │
│  └── Analytics Events                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                │
│                                                                  │
│  Layer 1: Network Security                                       │
│  ├── HTTPS/TLS (all connections)                                │
│  ├── DDoS Protection (Cloudflare)                               │
│  └── Rate Limiting (per IP, per user)                            │
│                                                                  │
│  Layer 2: Authentication                                         │
│  ├── Firebase Authentication                                     │
│  │   ├── Email/Password                                          │
│  │   ├── Google OAuth                                            │
│  │   └── JWT Tokens                                              │
│  └── Session Management (Redis)                                  │
│                                                                  │
│  Layer 3: Authorization                                          │
│  ├── Role-Based Access Control (RBAC)                           │
│  │   ├── User role                                                │
│  │   └── Admin role                                               │
│  ├── Resource-Level Permissions                                 │
│  └── API Key Management                                          │
│                                                                  │
│  Layer 4: Data Security                                          │
│  ├── Firestore Security Rules                                    │
│  ├── Input Validation                                            │
│  ├── SQL Injection Prevention                                   │
│  └── XSS Protection                                              │
│                                                                  │
│  Layer 5: Monitoring & Auditing                                   │
│  ├── Logging (all API calls)                                    │
│  ├── Error Tracking (Sentry)                                    │
│  └── Security Alerts                                             │
└─────────────────────────────────────────────────────────────────┘
```

### API Security

```typescript
// API Route with Security
export async function POST(request: NextRequest) {
  // 1. Authentication
  const token = request.headers.get('Authorization');
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Rate Limiting
  const rateLimitKey = `ratelimit:${user.uid}:${endpoint}`;
  const requests = await redis.incr(rateLimitKey);
  if (requests === 1) await redis.expire(rateLimitKey, 60);
  if (requests > 100) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  
  // 3. Input Validation
  const body = await request.json();
  const validated = schema.parse(body); // Zod validation
  
  // 4. Authorization
  if (requiresAdmin && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 5. Process request
  const result = await processRequest(validated, user);
  
  // 6. Logging
  await logAPIRequest(user.uid, endpoint, result);
  
  return NextResponse.json(result);
}
```

---

## 📊 Monitoring & Observability

### Metrics & Logging

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                               │
│                                                                  │
│  Application Metrics                                             │
│  ├── Request rate, latency, error rate                          │
│  ├── API endpoint performance                                   │
│  └── User activity metrics                                      │
│                                                                  │
│  Infrastructure Metrics                                         │
│  ├── CPU, Memory, Disk usage                                    │
│  ├── Network I/O                                                │
│  └── Database performance                                       │
│                                                                  │
│  Business Metrics                                                │
│  ├── Active users                                               │
│  ├── Incidents reported                                         │
│  ├── Travel plans generated                                     │
│  └── AI model accuracy                                          │
│                                                                  │
│  Logging                                                         │
│  ├── Application logs (structured JSON)                         │
│  ├── Error logs (Sentry)                                        │
│  └── Audit logs (security events)                               │
│                                                                  │
│  Alerting                                                        │
│  ├── Error rate > threshold                                     │
│  ├── Response time > threshold                                   │
│  ├── API cost > budget                                          │
│  └── Security incidents                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

**Cập nhật lần cuối:** December 2025


