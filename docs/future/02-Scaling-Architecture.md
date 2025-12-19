# Scaling Architecture - GrabTheBeyond

**Mục đích:** Sơ đồ và chiến lược tối ưu hóa hệ thống khi có nhiều người dùng đồng thời

---

## 📋 Mục Lục

1. [Kiến Trúc Tổng Quan](#kiến-trúc-tổng-quan)
2. [Load Balancing Strategy](#load-balancing-strategy)
3. [Caching Layers](#caching-layers)
4. [Database Optimization](#database-optimization)
5. [Real-Time Optimization](#real-time-optimization)
6. [Auto-Scaling Configuration](#auto-scaling-configuration)

---

## 🏗️ Kiến Trúc Tổng Quan

### Current Architecture vs Future Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                         │
│                                                                  │
│  Users → Vercel (Single Instance) → Firebase                    │
│         → Railway (Single Instance) → Socket.IO                  │
│                                                                  │
│  Limitations:                                                    │
│  - Single point of failure                                      │
│  - No horizontal scaling                                        │
│  - Limited caching                                              │
│  - API rate limits                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FUTURE ARCHITECTURE                          │
│                                                                  │
│  Users → CDN → Load Balancer → Multiple Instances              │
│         → Redis Cache → Database Cluster                        │
│         → Message Queue → Background Workers                    │
│                                                                  │
│  Benefits:                                                       │
│  - High availability                                            │
│  - Auto-scaling                                                 │
│  - Multi-layer caching                                          │
│  - Rate limiting & queuing                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Future Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Desktop    │  │   Mobile     │  │   Tablet     │  │   PWA        │  │
│  │   Browser    │  │   Browser    │  │   Browser    │  │   App        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │                 │
          └─────────────────┼─────────────────┼─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CDN LAYER (Vercel Edge)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Global Edge Network (100+ locations)                               │  │
│  │  - Static assets caching                                            │  │
│  │  - API response caching (TTL: 5-15 min)                              │  │
│  │  - Image optimization                                                │  │
│  │  - DDoS protection                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (Vercel/Cloudflare)                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  - Round-robin / Least connections                                   │  │
│  │  - Health checks                                                     │  │
│  │  - SSL termination                                                   │  │
│  │  - Rate limiting (per IP, per user)                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Next.js     │    │  Next.js     │    │  Next.js     │
│  Instance 1  │    │  Instance 2  │    │  Instance 3  │
│  (Vercel)    │    │  (Vercel)    │    │  (Vercel)    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CACHING LAYER (Redis)                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Redis Cluster (3 nodes)                                            │  │
│  │  - Weather data (TTL: 10 min)                                       │  │
│  │  - Incident queries (TTL: 5 min)                                    │  │
│  │  - Places data (TTL: 30 min)                                        │  │
│  │  - User sessions                                                     │  │
│  │  - Rate limit counters                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  - Request routing                                                   │  │
│  │  - Authentication                                                    │  │
│  │  - Rate limiting                                                     │  │
│  │  - Request queuing                                                   │  │
│  │  - API versioning                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
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
│                    MESSAGE QUEUE (RabbitMQ/Redis Queue)                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Queues:                                                             │  │
│  │  - incident_processing (high priority)                              │  │
│  │  - travel_plan_generation (normal priority)                         │  │
│  │  - image_classification (normal priority)                            │  │
│  │  - notifications (low priority)                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────┬──────────────────────┬───────────────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Worker 1    │    │  Worker 2    │    │  Worker 3    │
│  (Background)│    │  (Background) │    │  (Background)│
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Firebase Firestore (Primary)                                       │  │
│  │  - Auto-scaling                                                     │  │
│  │  - Regional replication                                             │  │
│  │  - Read replicas                                                    │  │
│  │                                                                      │  │
│  │  Redis (Cache + Sessions)                                          │  │
│  │  - Cluster mode                                                     │  │
│  │  - Persistence (AOF)                                                │  │
│  │                                                                      │  │
│  │  PostgreSQL (Analytics - Optional)                                 │  │
│  │  - Read replicas                                                    │  │
│  │  - Time-series data                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Load Balancing Strategy

### Load Balancer Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER RULES                          │
│                                                                  │
│  Rule 1: Health Check                                           │
│  - Endpoint: /health                                            │
│  - Interval: 30 seconds                                        │
│  - Timeout: 5 seconds                                           │
│  - Unhealthy threshold: 3 consecutive failures                  │
│                                                                  │
│  Rule 2: Sticky Sessions                                        │
│  - Use for WebSocket connections                                │
│  - Session affinity: IP-based                                   │
│  - Timeout: 1 hour                                              │
│                                                                  │
│  Rule 3: Routing Rules                                          │
│  - /api/* → API instances                                       │
│  - /socket.io/* → Socket.IO instances                          │
│  - /* → Next.js instances                                       │
│                                                                  │
│  Rule 4: Rate Limiting                                          │
│  - Per IP: 1000 req/min                                         │
│  - Per User: 100 req/min                                         │
│  - Burst: 20 requests                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Load Distribution Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│  Algorithm: Weighted Least Connections                          │
│                                                                  │
│  For each request:                                              │
│    1. Check health status of all instances                     │
│    2. Filter healthy instances                                  │
│    3. Calculate weight = base_weight / (active_connections + 1)│
│    4. Select instance with highest weight                      │
│    5. Route request                                             │
│                                                                  │
│  Benefits:                                                       │
│  - Distributes load evenly                                      │
│  - Handles varying request sizes                               │
│  - Adapts to instance capacity                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Caching Layers

### Multi-Layer Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                         │
│                                                                  │
│  Layer 1: Browser Cache                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Static assets (JS, CSS, images)                      │  │
│  │  - Cache-Control: max-age=31536000 (1 year)             │  │
│  │  - User preferences, recent queries                      │  │
│  │  - Size: ~50MB per user                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 2: CDN Cache (Vercel Edge)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - API responses (GET requests only)                      │  │
│  │  - TTL: 5-15 minutes (depending on data type)          │  │
│  │  - Cache-Control: public, s-maxage=300                  │  │
│  │  - Geographic distribution (100+ edge locations)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 3: Redis Cache (Application Level)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Weather data: TTL 10 min                              │  │
│  │  - Incident queries: TTL 5 min                            │  │
│  │  - Places data: TTL 30 min                                │  │
│  │  - User sessions: TTL 24 hours                            │  │
│  │  - Rate limit counters: TTL per window                    │  │
│  │  - Size: 2GB (can scale to 10GB+)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 4: Database Query Cache                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Firestore query results                               │  │
│  │  - Indexed queries cached automatically                  │  │
│  │  - Managed by Firestore                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Key Strategy

```javascript
// Cache key patterns
const cacheKeys = {
  weather: `weather:${lat}:${lng}:${date}`,
  incidents: `incidents:${bounds}:${filters}:${timestamp}`,
  places: `places:${query}:${location}:${radius}`,
  travelPlan: `travel_plan:${userId}:${planId}`,
  userSession: `session:${userId}`,
  rateLimit: `ratelimit:${userId}:${endpoint}:${window}`
};

// TTL Configuration
const cacheTTL = {
  weather: 600,        // 10 minutes
  incidents: 300,      // 5 minutes
  places: 1800,        // 30 minutes
  travelPlan: 3600,    // 1 hour
  userSession: 86400,  // 24 hours
  rateLimit: 60        // 1 minute
};
```

### Cache Invalidation Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE INVALIDATION                           │
│                                                                  │
│  Strategy 1: Time-Based (TTL)                                   │
│  - Automatic expiration                                          │
│  - Used for: Weather, static data                               │
│                                                                  │
│  Strategy 2: Event-Based                                        │
│  - Invalidate on data change                                    │
│  - Used for: Incidents, user data                              │
│  - Pattern: Pub/Sub → Invalidate cache                         │
│                                                                  │
│  Strategy 3: Manual Invalidation                                │
│  - Admin-triggered                                              │
│  - Used for: Emergency updates                                  │
│                                                                  │
│  Strategy 4: Version-Based                                      │
│  - Include version in cache key                                  │
│  - Used for: API responses, static content                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Optimization

### Firestore Indexes

```javascript
// Composite Indexes
const indexes = {
  incidents: [
    // Status + Date (for admin dashboard)
    {
      collection: 'incidents',
      fields: [
        { field: 'status', order: 'ASCENDING' },
        { field: 'createdAt', order: 'DESCENDING' }
      ]
    },
    // Type + Severity + Date (for filtering)
    {
      collection: 'incidents',
      fields: [
        { field: 'type', order: 'ASCENDING' },
        { field: 'severity_level', order: 'DESCENDING' },
        { field: 'createdAt', order: 'DESCENDING' }
      ]
    },
    // Location (Geohash) + Status (for map queries)
    {
      collection: 'incidents',
      fields: [
        { field: 'location.geohash', order: 'ASCENDING' },
        { field: 'status', order: 'ASCENDING' }
      ]
    }
  ],
  travel_plans: [
    // User + Date (for user's plans)
    {
      collection: 'travel_plans',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
        { field: 'createdAt', order: 'DESCENDING' }
      ]
    },
    // Status + Shared (for public plans)
    {
      collection: 'travel_plans',
      fields: [
        { field: 'status', order: 'ASCENDING' },
        { field: 'shared', order: 'ASCENDING' }
      ]
    }
  ]
};
```

### Query Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUERY OPTIMIZATION RULES                     │
│                                                                  │
│  Rule 1: Limit Results                                         │
│  - Always use .limit() to cap results                          │
│  - Default: 20 items per page                                  │
│  - Max: 100 items per query                                    │
│                                                                  │
│  Rule 2: Use Pagination                                        │
│  - Cursor-based pagination (better than offset)                │
│  - Store last document snapshot                                │
│  - Reduces read costs                                          │
│                                                                  │
│  Rule 3: Filter at Database Level                             │
│  - Use .where() filters instead of client-side filtering      │
│  - Reduces data transfer                                       │
│  - Faster queries                                              │
│                                                                  │
│  Rule 4: Select Only Needed Fields                             │
│  - Use .select() to limit fields returned                      │
│  - Reduces bandwidth                                           │
│                                                                  │
│  Rule 5: Batch Operations                                      │
│  - Group multiple writes/reads                                 │
│  - Use transactions for consistency                           │
│  - Reduces round trips                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Database Sharding Strategy (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARDING STRATEGY                            │
│                                                                  │
│  Shard Key: User ID (for user-specific data)                   │
│  - incidents: Shard by userId (reporter)                       │
│  - travel_plans: Shard by userId                               │
│  - chat_history: Shard by userId                               │
│                                                                  │
│  Shard Key: Location (for geographic data)                     │
│  - incidents: Shard by geohash prefix                         │
│  - places: Shard by city/region                                │
│                                                                  │
│  Benefits:                                                      │
│  - Distributes load across multiple databases                  │
│  - Improves query performance                                  │
│  - Enables horizontal scaling                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Real-Time Optimization

### Socket.IO Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOCKET.IO OPTIMIZATION                       │
│                                                                  │
│  Strategy 1: Room-Based Broadcasting                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Users join rooms based on location                    │  │
│  │  - Only broadcast to relevant rooms                      │  │
│  │  - Reduces message volume by 80-90%                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Strategy 2: Message Compression                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Enable perMessageDeflate                               │  │
│  │  - Compress large payloads                               │  │
│  │  - Reduces bandwidth by 60-70%                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Strategy 3: Heartbeat Optimization                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Increase ping interval to 30s (from 20s)             │  │
│  │  - Reduce ping timeout to 5s                            │  │
│  │  - Reduces overhead by 30%                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Strategy 4: Connection Pooling                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Reuse connections when possible                       │  │
│  │  - Limit concurrent connections per user                 │  │
│  │  - Implement connection queuing                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Firestore Listeners Optimization

```javascript
// Optimized Listener Pattern
const optimizedListeners = {
  // Only subscribe to needed data
  incidents: {
    query: collection(db, 'incidents')
      .where('status', '==', 'verified')
      .where('location.geohash', '>=', geohashBounds.min)
      .where('location.geohash', '<=', geohashBounds.max)
      .limit(50), // Limit results
    options: {
      // Only listen to changes, not full data
      includeMetadataChanges: false
    }
  },
  
  // Unsubscribe when not needed
  cleanup: () => {
    // Unsubscribe on component unmount
    // Unsubscribe when user navigates away
    // Unsubscribe when filters change significantly
  }
};
```

---

## 📈 Auto-Scaling Configuration

### Vercel Auto-Scaling

```json
{
  "scaling": {
    "minInstances": 1,
    "maxInstances": 10,
    "targetCPU": 70,
    "targetMemory": 80,
    "scaleUpThreshold": 75,
    "scaleDownThreshold": 30,
    "cooldownPeriod": 300
  }
}
```

### Railway Auto-Scaling

```yaml
# railway.yaml
services:
  - name: api-server
    scaling:
      min_replicas: 2
      max_replicas: 10
      target_cpu: 70
      target_memory: 80
      scale_up_policy:
        - metric: cpu_usage
          threshold: 75
          duration: 60s
        - metric: request_rate
          threshold: 1000/min
          duration: 30s
      scale_down_policy:
        - metric: cpu_usage
          threshold: 30
          duration: 300s
```

### Monitoring & Alerts

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING METRICS                           │
│                                                                  │
│  Infrastructure Metrics:                                        │
│  - CPU usage (target: <70%)                                    │
│  - Memory usage (target: <80%)                                 │
│  - Network I/O                                                  │
│  - Disk I/O                                                     │
│                                                                  │
│  Application Metrics:                                           │
│  - Request rate (requests/second)                              │
│  - Response time (p50, p95, p99)                              │
│  - Error rate (<1%)                                            │
│  - Cache hit rate (>80%)                                       │
│                                                                  │
│  Business Metrics:                                              │
│  - Active users                                                 │
│  - Incident reports per hour                                    │
│  - Travel plans generated                                       │
│  - API costs                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Performance Targets

### Response Time Goals

- **API Responses**: < 200ms (p95)
- **Page Load**: < 2s (First Contentful Paint)
- **Real-time Updates**: < 1s latency
- **Database Queries**: < 100ms (p95)

### Scalability Goals

- **Concurrent Users**: 10,000+
- **Requests/Second**: 1,000+
- **Database Reads**: 5,000/sec
- **Database Writes**: 1,000/sec

### Cost Optimization

- **Cache Hit Rate**: > 80%
- **API Call Reduction**: 60% via caching
- **Database Read Reduction**: 70% via caching
- **CDN Bandwidth**: 90% of static assets

---

**Cập nhật lần cuối:** December 2025




