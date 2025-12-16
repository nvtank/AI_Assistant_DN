# System Architecture Diagram

## 🏗️ Kiến Trúc Tổng Thể Hệ Thống

Hệ thống GrabTheBeyond được thiết kế theo kiến trúc **Microservices-inspired Monolithic Architecture** với **Event-Driven Real-time Communication**.

---

## 📐 High-Level Architecture

```mermaid
graph TB
    Client[Web/Mobile Client]
    NextJS[Next.js Server]
    Express[Express + Socket.IO]
    Firestore[(Firestore DB)]
    Firebase[Firebase Auth/Storage]
    Gemini[Gemini AI]
    Places[Google Places]
    
    Client --> NextJS
    Client -.WebSocket.-> Express
    NextJS --> Express
    NextJS --> Firebase
    NextJS --> Gemini
    NextJS --> Places
    Express --> Firestore
    NextJS --> Firestore
```

---

## 🔄 Architecture Layers Explained

### 1. **Client Layer** (Presentation Tier)
- **Technology**: React 18, Next.js 14 App Router, TypeScript
- **Responsibilities**:
  - User interface rendering
  - Client-side state management
  - Form validation
  - Socket.IO client connection
  - Geolocation API integration
  - Speech Recognition (Web API)

### 2. **CDN & Edge Layer** (Content Delivery)
- **Technology**: Vercel Edge Network, Cloudinary
- **Responsibilities**:
  - Static asset caching (JS, CSS, images)
  - Server-Side Rendering at edge locations
  - Image optimization and transformation
  - Global content distribution

### 3. **Application Layer** (Business Logic)

#### Next.js Server
- **Server-Side Rendering (SSR)**: Pre-render pages with user data
- **API Routes**: RESTful endpoints for:
  - `/api/geocode`: Reverse geocoding
  - `/api/weather`: Weather data fetching
  - `/api/users/offline`: Online presence management
  - `/api/incidents/broadcast`: Incident broadcasting
  - `/api/travel-plan/*`: Travel planning endpoints
  - `/api/upload`: File upload handler

#### Express Backend
- **HTTP Server**: REST API for legacy endpoints
- **Socket.IO Server**: Real-time bidirectional communication
- **Multer Middleware**: Multipart form data handling

### 4. **Service Layer** (Domain Services)

| Service | File | Responsibilities |
|---------|------|-----------------|
| **Auth Service** | `lib/authService.ts` | Login, signup, session management |
| **Incident Service** | `lib/incidentServiceFirebase.ts` | Create, read, update incidents |
| **Travel Service** | `lib/travelPlanService.ts` | Generate trip plans, save itineraries |
| **Online Users** | `lib/onlineUsersService.ts` | Heartbeat tracking, presence |
| **AI Service** | `lib/geminiAI.ts` | Gemini API integration, prompt engineering |
| **Places Service** | `lib/placesAPI.ts` | Google Places search, venue details |

### 5. **External APIs Layer**
- **Google Gemini AI**: Context-aware chatbot responses
- **Google Places API**: Venue search, reviews, ratings
- **OpenWeather API**: Current weather, forecasts
- **Nominatim API**: Lat/long to address conversion
- **Grab Deep Link**: Mobile app integration

### 6. **Data Layer** (Persistence)

#### Firebase Firestore Collections:
```
firestore/
├── users/               # User profiles
├── incidents/           # Reported incidents
├── travel_plans/        # Generated trip plans
├── online_users/        # Current online users (TTL)
└── chat_history/        # AI conversation logs
```

#### Firebase Storage:
```
storage/
└── incident_images/     # Uploaded incident photos
```

### 7. **Real-time Layer** (Event-Driven)

#### Socket.IO Events:
- `incident:new`: New incident reported
- `incident:update`: Incident status changed
- `user:online`: User came online
- `user:offline`: User went offline

#### Firestore Listeners:
- `onSnapshot(incidents)`: Real-time incident updates
- `onSnapshot(online_users)`: Real-time user count
- `onSnapshot(travel_plans)`: Trip plan updates

---

## 🔐 Security Architecture

```mermaid
graph LR
    User --> Auth[Firebase Auth]
    Auth --> API[API + Middleware]
    API --> Validate[Validation]
    Validate --> DB[(Firestore)]
```

### Security Measures:
1. **Authentication**: Firebase Auth with JWT tokens
2. **Authorization**: Firestore Security Rules
3. **CORS**: Configured origin whitelist
4. **Input Validation**: Server-side validation for all inputs
5. **XSS Prevention**: React auto-escaping, sanitized user inputs
6. **CSRF Protection**: SameSite cookies, token validation
7. **Rate Limiting**: API throttling (planned)
8. **Secure Storage**: HTTPS-only, signed URLs for images

---

## 📊 Data Flow Architecture

```mermaid
flowchart LR
    User --> Client
    Client --> API
    API --> Service
    Service --> DB[(Firestore)]
    DB --> Client
```

---

## 🚀 Deployment Architecture

```mermaid
graph LR
    Vercel[Vercel<br/>Next.js App]
    Railway[Railway<br/>Express Server]
    Firebase[Firebase<br/>Database + Auth]
    
    Vercel --> Railway
    Vercel --> Firebase
    Railway --> Firebase
```

---

## 📈 Scalability Considerations

### Horizontal Scaling:
- ✅ **Stateless API**: Next.js API routes can scale horizontally
- ✅ **Firestore**: Auto-scales with load
- ⚠️ **Socket.IO**: Requires Redis adapter for multi-instance (future)

### Vertical Scaling:
- **Express Server**: Can be upgraded to larger containers
- **Firebase**: Automatic based on usage tier

### Performance Optimizations:
1. **Code Splitting**: Next.js automatic route-based splitting
2. **Image Optimization**: Next.js Image component + Cloudinary
3. **Caching**: Firestore client-side cache, CDN caching
4. **Lazy Loading**: React.lazy() for heavy components
5. **Memoization**: React.memo(), useMemo() for expensive renders

---

## 🔍 Monitoring & Observability

```mermaid
graph LR
    APP[Application] --> LOGS[Console Logs]
    APP --> FB_ANALYTICS[Firebase Analytics]
    APP --> ERROR_TRACKING[Error Boundaries]
    
    LOGS --> RAILWAY_LOGS[Railway Logs]
    FB_ANALYTICS --> FB_CONSOLE[Firebase Console]
    ERROR_TRACKING --> SENTRY[Sentry - Optional]

    style APP fill:#61dafb,stroke:#333,stroke-width:2px
```

### Monitoring Tools:
- **Firebase Console**: User analytics, crash reports
- **Railway Logs**: Server logs, error tracking
- **Browser DevTools**: Network, performance profiling
- **Lighthouse**: Performance audits

---

**Architecture Version**: 1.0  
**Last Updated**: December 2025  
**Status**: Production-Ready

