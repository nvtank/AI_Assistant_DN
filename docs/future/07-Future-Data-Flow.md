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
    
    User->>Frontend: Submit Report
    Frontend->>API: POST /api/incidents
    API->>Firestore: Save Incident
    API->>n8n: Webhook Trigger
    n8n->>MLModel: Predict
    MLModel-->>n8n: Result
    n8n->>Firestore: Update Status
    Firestore-->>Frontend: Notify
    Frontend-->>User: Show on Map
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
    
    User->>Frontend: Submit Request
    Frontend->>API: POST /api/travel-plan
    API->>n8n: Webhook
    n8n->>WeatherAPI: Get Weather
    n8n->>PlacesAPI: Get Places
    WeatherAPI-->>n8n: Weather Data
    PlacesAPI-->>n8n: Places Data
    n8n->>Gemini: Generate Plan
    Gemini-->>n8n: Itinerary
    n8n->>Firestore: Save Plan
    Firestore-->>API: Success
    API-->>Frontend: Return Plan
    Frontend-->>User: Display
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
    
    User->>Frontend: Search Place
    Frontend->>API: GET /api/places/autocomplete
    API->>Redis: Check Cache
    alt Cache Hit
        Redis-->>API: Cached Results
    else Cache Miss
        API->>PlacesAPI: Get Autocomplete
        PlacesAPI-->>API: Results
        API->>Redis: Cache
    end
    API-->>Frontend: Return
    Frontend-->>User: Show Results
```

---

## ✏️ Plan Editing Data Flow

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Validator
    participant API
    participant Firestore
    
    User->>Editor: Open Editor
    Editor->>Firestore: Get Plan
    Firestore-->>Editor: Plan Data
    User->>Editor: Edit Plan
    Editor->>Validator: Validate
    Validator-->>Editor: Result
    User->>Editor: Save
    Editor->>API: PUT /api/travel-plan
    API->>Firestore: Update
    Firestore-->>API: Success
    API-->>Editor: Success
    Editor-->>User: Show Success
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
    
    User1->>Frontend1: Submit Incident
    Frontend1->>API: POST /api/incidents
    API->>Firestore: Save
    API->>SocketIO: Broadcast
    SocketIO->>Frontend1: Update
    SocketIO->>Frontend2: Update
    Frontend1->>User1: Show on Map
    Frontend2->>User2: Show on Map
```

---

## 🔄 Caching Strategy Data Flow

### Multi-Layer Cache Flow

```mermaid
flowchart TD
    Request[User Request] --> Browser{Browser Cache}
    Browser -->|Hit| Return1[Return]
    Browser -->|Miss| CDN{CDN Cache}
    CDN -->|Hit| Return2[Return]
    CDN -->|Miss| Redis{Redis Cache}
    Redis -->|Hit| Return3[Return]
    Redis -->|Miss| Firestore{Firestore}
    Firestore -->|Found| Return4[Return]
    Firestore -->|Not Found| API[External API]
    API --> Save[Save & Cache]
    Save --> Return5[Return]
```

---

## 🔄 Background Job Processing Flow

### Message Queue Processing

```mermaid
flowchart LR
    API[API Request] --> Queue[Message Queue]
    Queue --> Q1[High Priority]
    Queue --> Q2[Normal Priority]
    Queue --> Q3[Normal Priority]
    Queue --> Q4[Low Priority]
    Q1 --> Worker1[Worker 1]
    Q2 --> Worker2[Worker 2]
    Q3 --> Worker3[Worker 3]
    Q4 --> Worker4[Worker 4]
    Worker1 --> Firestore[(Firestore)]
    Worker2 --> Firestore
    Worker3 --> Firestore
    Worker4 --> Firestore
```

---

## 📊 Analytics Data Flow

### Data Collection and Analysis

```mermaid
flowchart TD
    UserAction[User Actions] --> Collector[Event Collector]
    Collector --> Queue[Event Queue]
    Queue --> Processor[Batch Processor]
    Processor --> DB[(Analytics DB)]
    DB --> Aggregator[Data Aggregator]
    Aggregator --> Metrics[Metrics Store]
    Metrics --> Dashboard[Admin Dashboard]
    Metrics --> Alerts[Alert System]
    Alerts --> Notification[Send Notification]
```

---

**Cập nhật lần cuối:** December 2025
