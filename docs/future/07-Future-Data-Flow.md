# Future Data Flow Diagrams - GrabTheBeyond

**Mục đích:** Sơ đồ luồng dữ liệu tương lai với AI và các tính năng mới

---

## 📋 Mục Lục

1. [AI Image Classification Data Flow](#ai-image-classification-data-flow)
2. [Travel Plan Generation Data Flow](#travel-plan-generation-data-flow)
3. [Google Places Integration Data Flow](#google-places-integration-data-flow)
4. [Plan Editing Data Flow](#plan-editing-data-flow)
5. [Real-Time Updates Data Flow](#real-time-updates-data-flow)

---

## 🤖 AI Image Classification Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant n8n
    participant MLModel
    participant Firestore
    participant SocketIO
    
    User->>Frontend: Submit incident report<br/>(Image + Location + Description)
    Frontend->>API: POST /api/incidents/report
    API->>Firestore: Save incident (status: pending)
    API->>n8n: Webhook trigger<br/>(incident_id, image_url)
    
    n8n->>Firestore: GET image from Storage
    n8n->>n8n: Preprocess image<br/>(Resize, Normalize)
    n8n->>MLModel: POST /predict<br/>(base64 image)
    MLModel-->>n8n: Prediction result<br/>(type, severity, confidence)
    
    n8n->>n8n: Decision logic<br/>(confidence > 85%?)
    
    alt Auto-approve (confidence > 85%)
        n8n->>Firestore: Update status: verified<br/>Store AI analysis
        n8n->>SocketIO: Broadcast incident:new
        SocketIO->>Frontend: Real-time update
        Frontend->>User: Show incident on map
    else Priority review (confidence > 70%)
        n8n->>Firestore: Update status: priority_review<br/>Store AI analysis
        n8n->>API: Notify admin
    else Manual review (confidence < 70%)
        n8n->>Firestore: Update status: pending<br/>Store AI analysis
    end
```

---

## 🧳 Travel Plan Generation Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant n8n
    participant Gemini
    participant PlacesAPI
    participant WeatherAPI
    participant Firestore
    participant Redis
    
    User->>Frontend: Submit travel plan request
    Frontend->>API: POST /api/travel-plan/generate
    API->>Redis: Check cache<br/>(key: plan_hash)
    
    alt Cache hit
        Redis-->>API: Return cached plan
        API-->>Frontend: Return plan
    else Cache miss
        API->>n8n: Webhook trigger<br/>(request data)
        
        par Parallel requests
            n8n->>WeatherAPI: GET forecast<br/>(dates, location)
            n8n->>PlacesAPI: GET nearby places<br/>(location, preferences)
        end
        
        WeatherAPI-->>n8n: Weather forecast
        PlacesAPI-->>n8n: Places data
        
        n8n->>n8n: Prepare context<br/>(Format weather + places)
        n8n->>Gemini: POST /generateContent<br/>(Prompt + Context)
        Gemini-->>n8n: AI-generated itinerary
        
        n8n->>n8n: Parse response<br/>(Extract activities, times)
        n8n->>n8n: Calculate costs<br/>(Grab costs, totals)
        
        n8n->>Firestore: Save travel plan
        n8n->>Redis: Cache plan<br/>(TTL: 1 hour)
        n8n-->>API: Return plan
        API-->>Frontend: Return plan
    end
    
    Frontend->>User: Display itinerary
```

---

## 📍 Google Places Integration Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Redis
    participant Firestore
    participant PlacesAPI
    
    User->>Frontend: Search for place<br/>(Autocomplete)
    Frontend->>API: GET /api/places/autocomplete?input=...
    API->>Redis: Check cache<br/>(key: autocomplete:input:location)
    
    alt Cache hit
        Redis-->>API: Return cached results
        API-->>Frontend: Return suggestions
    else Cache miss
        API->>PlacesAPI: GET Autocomplete<br/>(input, location)
        PlacesAPI-->>API: Place suggestions
        
        API->>Redis: Cache results<br/>(TTL: 1 hour)
        API-->>Frontend: Return suggestions
    end
    
    User->>Frontend: Select place
    Frontend->>API: GET /api/places/details?place_id=...
    API->>Firestore: Check if place exists
    
    alt Place in Firestore
        API->>Firestore: Get place data
        Firestore-->>API: Place details
        
        alt Data stale (> 24 hours)
            API->>PlacesAPI: GET Place Details
            PlacesAPI-->>API: Updated details
            API->>Firestore: Update place
            API-->>Frontend: Return updated details
        else Data fresh
            API-->>Frontend: Return cached details
        end
    else Place not in Firestore
        API->>PlacesAPI: GET Place Details
        PlacesAPI-->>API: Place details
        API->>Firestore: Save new place
        API-->>Frontend: Return details
    end
```

---

## ✏️ Plan Editing Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Editor
    participant Validator
    participant API
    participant Firestore
    participant SocketIO
    
    User->>Editor: Open plan editor
    Editor->>Firestore: GET travel plan
    Firestore-->>Editor: Plan data
    
    User->>Editor: Drag & drop activity
    Editor->>Editor: Reorder activities
    Editor->>Validator: Validate changes
    
    Validator->>Validator: Check time conflicts
    Validator->>Validator: Check budget
    Validator->>Validator: Check travel time
    
    alt Validation passes
        Validator-->>Editor: Valid
        Editor->>Editor: Auto-adjust times
        Editor->>Editor: Recalculate costs
        Editor->>User: Show updated plan
    else Validation fails
        Validator-->>Editor: Conflicts detected
        Editor->>User: Show warnings
    end
    
    User->>Editor: Click Save
    Editor->>API: PUT /api/travel-plan/:id
    API->>Firestore: Update plan<br/>(Increment version)
    API->>Firestore: Save edit history
    
    Firestore-->>API: Success
    API->>SocketIO: Broadcast plan:updated
    SocketIO->>Frontend: Real-time notification
    API-->>Editor: Success response
    Editor->>User: Show success message
```

---

## 🔄 Real-Time Updates Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant Frontend1
    participant Frontend2
    participant API
    participant Firestore
    participant SocketIO
    participant Redis
    
    Note over User1,Redis: User 1 reports incident
    
    User1->>Frontend1: Submit incident
    Frontend1->>API: POST /api/incidents/report
    API->>Firestore: Save incident
    API->>Redis: Publish event<br/>(incident:new)
    
    Redis->>SocketIO: Event notification
    SocketIO->>Frontend1: Emit incident:new<br/>(to User1)
    SocketIO->>Frontend2: Emit incident:new<br/>(to User2)
    
    Frontend1->>User1: Show on map
    Frontend2->>User2: Show on map
    
    Note over User1,Redis: AI processes and auto-approves
    
    API->>Firestore: Update status: verified
    Firestore->>Redis: Publish event<br/>(incident:verified)
    
    Redis->>SocketIO: Event notification
    SocketIO->>Frontend1: Emit incident:update
    SocketIO->>Frontend2: Emit incident:update
    
    Frontend1->>User1: Update marker color
    Frontend2->>User2: Update marker color
```

---

## 🔄 Caching Strategy Data Flow

### Multi-Layer Cache Flow

```mermaid
flowchart TD
    Request[User Request] --> BrowserCache{Browser Cache}
    BrowserCache -->|Cache Hit| Return1[Return Cached Data]
    BrowserCache -->|Cache Miss| CDN[CDN Edge Cache]
    
    CDN -->|Cache Hit| Return2[Return Cached Data<br/>Update Browser Cache]
    CDN -->|Cache Miss| Redis{Redis Cache}
    
    Redis -->|Cache Hit| Return3[Return Cached Data<br/>Update CDN Cache<br/>Update Browser Cache]
    Redis -->|Cache Miss| Firestore{Firestore}
    
    Firestore -->|Data Found| Return4[Return Data<br/>Update Redis Cache<br/>Update CDN Cache<br/>Update Browser Cache]
    Firestore -->|Data Not Found| ExternalAPI[External API<br/>Google Places/Weather]
    
    ExternalAPI --> Save[Save to Firestore<br/>Cache in Redis<br/>Cache in CDN<br/>Cache in Browser]
    Save --> Return5[Return Data]
    
    style Request fill:#e1f5ff
    style BrowserCache fill:#fff4e1
    style CDN fill:#fff4e1
    style Redis fill:#fff4e1
    style Firestore fill:#d4edda
    style ExternalAPI fill:#ffe1f5
    style Return1 fill:#d4edda
    style Return2 fill:#d4edda
    style Return3 fill:#d4edda
    style Return4 fill:#d4edda
    style Return5 fill:#d4edda
```

---

## 🔄 Background Job Processing Flow

### Message Queue Processing

```mermaid
flowchart LR
    API[API Request] --> Queue[Message Queue]
    
    subgraph "High Priority Queue"
        Q1[incident_processing]
    end
    
    subgraph "Normal Priority Queue"
        Q2[travel_plan_generation]
        Q3[image_classification]
    end
    
    subgraph "Low Priority Queue"
        Q4[notifications]
    end
    
    Queue --> Q1
    Queue --> Q2
    Queue --> Q3
    Queue --> Q4
    
    Q1 --> Worker1[Worker 1<br/>High Priority]
    Q2 --> Worker2[Worker 2<br/>Normal Priority]
    Q3 --> Worker3[Worker 3<br/>Normal Priority]
    Q4 --> Worker4[Worker 4<br/>Low Priority]
    
    Worker1 --> Process1[Process Incident]
    Worker2 --> Process2[Generate Plan]
    Worker3 --> Process3[Classify Image]
    Worker4 --> Process4[Send Notification]
    
    Process1 --> Firestore[(Firestore)]
    Process2 --> Firestore
    Process3 --> Firestore
    Process4 --> Firestore
    
    style API fill:#e1f5ff
    style Queue fill:#fff4e1
    style Q1 fill:#f8d7da
    style Q2 fill:#fff3cd
    style Q3 fill:#fff3cd
    style Q4 fill:#d1ecf1
    style Worker1 fill:#d4edda
    style Worker2 fill:#d4edda
    style Worker3 fill:#d4edda
    style Worker4 fill:#d4edda
```

---

## 📊 Analytics Data Flow

### Data Collection and Analysis

```mermaid
flowchart TD
    UserAction[User Actions] --> EventCollector[Event Collector]
    EventCollector --> EventQueue[Event Queue]
    
    EventQueue --> BatchProcessor[Batch Processor<br/>Process every 5 min]
    BatchProcessor --> AnalyticsDB[(Analytics DB<br/>PostgreSQL)]
    
    AnalyticsDB --> Aggregator[Data Aggregator<br/>Daily/Hourly]
    Aggregator --> Metrics[Metrics Store]
    
    Metrics --> Dashboard[Admin Dashboard]
    Metrics --> Alerts[Alert System]
    
    Alerts -->|Threshold exceeded| Notification[Send Notification]
    
    style UserAction fill:#e1f5ff
    style EventCollector fill:#fff4e1
    style EventQueue fill:#fff4e1
    style BatchProcessor fill:#fff4e1
    style AnalyticsDB fill:#d4edda
    style Aggregator fill:#fff4e1
    style Metrics fill:#d4edda
    style Dashboard fill:#d4edda
    style Alerts fill:#f8d7da
    style Notification fill:#f8d7da
```

---

**Cập nhật lần cuối:** December 2025
