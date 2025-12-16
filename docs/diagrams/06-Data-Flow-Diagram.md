# Data Flow Diagram (DFD)

## 🔄 System Data Flow Analysis

Data Flow Diagram mô tả cách dữ liệu di chuyển qua các thành phần của hệ thống GrabTheBeyond.

---

## 📊 Level 0 - Context Diagram

```mermaid
graph TB
    User([User])
    Admin([Admin])
    System[GrabTheBeyond System]
    External[External APIs]

    User -->|Requests| System
    System -->|Responses| User
    Admin -->|Manage| System
    System <-->|Data| External
```

---

## 📈 Level 1 - Main Processes

```mermaid
graph TB
    User([User])
    P1[1. Authentication]
    P2[2. Incident Management]
    P3[3. AI Chatbot]
    P4[4. Travel Planning]
    DB[(Database)]
    APIs[External APIs]

    User --> P1
    User --> P2
    User --> P3
    User --> P4
    
    P1 --> DB
    P2 --> DB
    P3 --> APIs
    P4 --> APIs
    P4 --> DB
```

---

## 🔍 Level 2 - Detailed Processes

### 2.1 Incident Reporting Process

```mermaid
graph TB
    USER([User]) -->|Incident details| P21[2.1<br/>Validate Input]
    P21 -->|Valid data| P22[2.2<br/>Upload Image]
    P22 -->|Image URL| P23[2.3<br/>Geocode Location]
    P23 -->|Address| P24[2.4<br/>Store Incident]
    P24 -->|Incident ID| P25[2.5<br/>Broadcast Event]
    P25 -->|Success| USER

    P22 -.Store.-> STORAGE[(Firebase Storage)]
    P23 -.Query.-> GEOCODE[Geocoding API]
    P24 -.Write.-> DB[(Incidents DB)]
    P25 -.Emit.-> SOCKET[Socket.IO]
    SOCKET -.Notify.-> OTHER([Other Users])

    style P21 fill:#BBDEFB
    style P22 fill:#C8E6C9
    style P23 fill:#FFE0B2
    style P24 fill:#F8BBD0
    style P25 fill:#D1C4E9
```

---

### 2.2 AI Chatbot Processing

```mermaid
graph TB
    USER([User]) -->|Message| P31[3.1<br/>Parse Intent]
    P31 -->|Context| P32[3.2<br/>Build Prompt]
    P32 -->|Enriched prompt| P33[3.3<br/>Call Gemini AI]
    
    P33 -.Request.-> GEMINI[Gemini API]
    GEMINI -.Response.-> P33
    
    P33 -->|AI response| P34{3.4<br/>Function Call?}
    
    P34 -->|Yes: searchPlaces| P35[3.5<br/>Query Places API]
    P35 -.Search.-> PLACES[Places API]
    PLACES -.Results.-> P35
    P35 -->|Place data| P33
    
    P34 -->|Yes: getWeather| P36[3.6<br/>Query Weather API]
    P36 -.Query.-> WEATHER[Weather API]
    WEATHER -.Data.-> P36
    P36 -->|Weather data| P33
    
    P34 -->|No| P37[3.7<br/>Format Response]
    P37 -->|Final response| USER
    
    P37 -.Save.-> CHAT_DB[(Chat History)]

    style P33 fill:#FFE082
    style P34 fill:#CE93D8
    style P35 fill:#80CBC4
    style P36 fill:#90CAF9
```

---

### 2.3 Travel Plan Generation

```mermaid
graph TB
    USER([User]) -->|Preferences| P41[4.1<br/>Validate Parameters]
    P41 -->|Valid params| P42[4.2<br/>Build AI Prompt]
    P42 -->|Detailed prompt| P43[4.3<br/>Generate with AI]
    
    P43 -.Generate.-> GEMINI[Gemini API]
    GEMINI -.RawItinerary.-> P43
    
    P43 -->|Raw text| P44[4.4<br/>Parse Itinerary]
    P44 -->|Structured data| P45[4.5<br/>Enrich with Places]
    
    P45 -.Query.-> PLACES[Places API]
    PLACES -.Details.-> P45
    
    P45 -->|Enriched data| P46[4.6<br/>Calculate Costs]
    P46 -->|Complete plan| P47[4.7<br/>Save to DB]
    P47 -->|Plan ID| USER
    
    P47 -.Store.-> TRAVEL_DB[(Travel Plans DB)]

    style P43 fill:#FFF59D
    style P44 fill:#A5D6A7
    style P45 fill:#81D4FA
    style P46 fill:#CE93D8
```

---

## 🔥 Real-time Data Synchronization Flow

```mermaid
sequenceDiagram
    participant User1
    participant Client1 as Client 1
    participant Firestore
    participant Listener as Real-time Listener
    participant Client2 as Client 2
    participant User2

    User1->>Client1: Report incident
    Client1->>Firestore: Write incident document
    Firestore-->>Client1: Write confirmed
    
    Firestore->>Listener: Trigger onSnapshot
    Listener->>Client1: Document added event
    Listener->>Client2: Document added event
    
    Client1->>Client1: Add marker to map
    Client2->>Client2: Add marker to map
    
    Client2-->>User2: Show new incident
```

---

## 📤 Data Flow Matrices

### Input/Output Matrix

| Process | Input Data | Output Data | Data Store |
|---------|-----------|-------------|------------|
| **1.0 Authentication** | Email, password | User profile, JWT token | Users DB |
| **2.0 Incident Reporting** | Title, description, location, image | Incident ID, confirmation | Incidents DB, Storage |
| **3.0 AI Chatbot** | User message, context | AI response, places | Chat History DB |
| **4.0 Travel Planning** | Days, budget, interests | Travel plan, itinerary | Travel Plans DB |
| **5.0 Real-time Sync** | Database changes | Real-time events | Online Users Cache |

---

### Data Store Access Matrix

| Process | Users (D1) | Incidents (D2) | Travel Plans (D3) | Chat (D4) | Online (D5) |
|---------|:----------:|:--------------:|:-----------------:|:---------:|:-----------:|
| **1.0 Authentication** | R/W | - | - | - | W |
| **2.0 Incident Reporting** | R | R/W | - | - | - |
| **3.0 AI Chatbot** | R | R | R | R/W | - |
| **4.0 Travel Planning** | R | - | R/W | - | - |
| **5.0 Real-time Sync** | - | R | R | - | R |

**Legend**: R = Read, W = Write

---

## 🌊 Critical Data Flows

### Flow 1: Incident Creation with Image

```mermaid
graph LR
    A[User Input] --> B[Validate]
    B --> C[Compress Image]
    C --> D[Upload to Cloudinary]
    D --> E[Get Image URL]
    E --> F[Reverse Geocode]
    F --> G[Create Firestore Doc]
    G --> H[Emit Socket Event]
    H --> I[Broadcast to Clients]
    I --> J[Update UI]

    style A fill:#E3F2FD
    style D fill:#FFE0B2
    style G fill:#C8E6C9
    style H fill:#F8BBD0
```

**Data Elements:**
- `title`: string (max 100 chars)
- `description`: string (max 500 chars)
- `category`: enum (8 options)
- `severity`: enum (4 levels)
- `location`: { lat: number, lng: number }
- `imageFile`: File (max 5MB, JPEG/PNG)
- `imageUrl`: string (Cloudinary URL)
- `address`: string (reverse geocoded)

---

### Flow 2: AI Function Calling

```mermaid
graph TB
    START([User Query]) --> PARSE[Parse Message]
    PARSE --> GEMINI[Send to Gemini]
    GEMINI --> CHECK{Function<br/>Call?}
    
    CHECK -->|searchPlaces| PLACES[Query Places API]
    PLACES --> RETURN[Return Results]
    RETURN --> GEMINI
    
    CHECK -->|getWeather| WEATHER[Query Weather API]
    WEATHER --> RETURN2[Return Data]
    RETURN2 --> GEMINI
    
    CHECK -->|No function| RESPONSE[Format Response]
    RESPONSE --> END([Display to User])

    style GEMINI fill:#4285f4,color:#fff
    style CHECK fill:#FFD54F
```

**Function Call Schema:**
```json
{
  "name": "searchPlaces",
  "parameters": {
    "query": "string",
    "location": { "lat": "number", "lng": "number" },
    "radius": "number",
    "type": "string"
  }
}
```

---

### Flow 3: Online Users Tracking

```mermaid
graph LR
    LOGIN[User Login] --> SET[Set online_users doc]
    SET --> HEARTBEAT[Start Heartbeat Timer]
    HEARTBEAT -->|Every 20s| UPDATE[Update lastSeen]
    UPDATE --> HEARTBEAT
    
    LISTEN[All Clients] --> SNAPSHOT[Listen onSnapshot]
    SNAPSHOT --> FILTER[Filter lastSeen < 30s]
    FILTER --> COUNT[Count Active Users]
    COUNT --> DISPLAY[Display Count]
    
    LOGOUT[User Logout/Close] --> DELETE[Delete online_users doc]
    DELETE --> TRIGGER[Trigger Snapshot]
    TRIGGER --> SNAPSHOT

    style SET fill:#C8E6C9
    style UPDATE fill:#FFE0B2
    style DELETE fill:#FFCDD2
```

---

## 📊 Data Volume Estimates

### Expected Data Volumes (1 year)

| Data Type | Records | Storage | Growth Rate |
|-----------|---------|---------|-------------|
| **Users** | 10,000 | 50 MB | 1K/month |
| **Incidents** | 50,000 | 200 MB | 5K/month |
| **Travel Plans** | 20,000 | 500 MB | 2K/month |
| **Chat Messages** | 100,000 | 300 MB | 10K/month |
| **Incident Images** | 30,000 | 15 GB | 3K/month |

**Total Storage (Year 1)**: ~16 GB

---

## 🔒 Data Security Flow

```mermaid
graph TB
    CLIENT[Client Request] --> AUTH{Authenticated?}
    AUTH -->|No| REJECT[Reject 401]
    AUTH -->|Yes| TOKEN[Verify JWT Token]
    TOKEN --> ROLE{Check Role}
    ROLE -->|Unauthorized| REJECT2[Reject 403]
    ROLE -->|Authorized| VALIDATE[Validate Input]
    VALIDATE --> SANITIZE[Sanitize Data]
    SANITIZE --> ENCRYPT[Encrypt Sensitive Fields]
    ENCRYPT --> FIRESTORE[(Firestore)]
    FIRESTORE --> RULES[Security Rules Check]
    RULES -->|Pass| WRITE[Write Data]
    RULES -->|Fail| REJECT3[Reject 403]
    WRITE --> SUCCESS[Return Success]

    style AUTH fill:#FFE0B2
    style ROLE fill:#CE93D8
    style ENCRYPT fill:#A5D6A7
    style RULES fill:#81D4FA
```

---

## 🔄 Data Transformation Pipeline

### Travel Plan Generation Pipeline

```mermaid
graph LR
    INPUT[User Input<br/>Preferences] --> VALIDATE[Validate<br/>& Sanitize]
    VALIDATE --> PROMPT[Build<br/>AI Prompt]
    PROMPT --> AI[Gemini AI<br/>Generation]
    AI --> PARSE[Parse<br/>Markdown]
    PARSE --> STRUCTURE[Structure<br/>JSON]
    STRUCTURE --> ENRICH[Enrich<br/>with Places API]
    ENRICH --> CALC[Calculate<br/>Costs]
    CALC --> FORMAT[Format<br/>for Display]
    FORMAT --> SAVE[Save to<br/>Firestore]
    SAVE --> OUTPUT[Output<br/>Travel Plan]

    style INPUT fill:#E3F2FD
    style AI fill:#4285f4,color:#fff
    style ENRICH fill:#FFE0B2
    style SAVE fill:#C8E6C9
```

**Transformation Steps:**

1. **Input** (User Form):
```json
{
  "days": 3,
  "budget": 5000000,
  "people": 2,
  "interests": ["beach", "food"]
}
```

2. **AI Prompt** (Engineered):
```text
Create a 3-day travel itinerary for Da Nang, Vietnam.
Budget: 5,000,000 VND for 2 people.
Interests: beach activities, local food.
Format: Day 1: Morning/Afternoon/Evening activities...
```

3. **AI Output** (Raw Text):
```text
Day 1:
Morning: Visit My Khe Beach...
Afternoon: Lunch at seafood restaurant...
```

4. **Parsed Structure** (JSON):
```json
{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "timeSlot": "morning",
          "name": "My Khe Beach",
          "description": "..."
        }
      ]
    }
  ]
}
```

5. **Enriched Data** (With Places API):
```json
{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "name": "My Khe Beach",
          "placeId": "ChIJ...",
          "rating": 4.5,
          "photos": ["https://..."],
          "location": { "lat": 16.04, "lng": 108.24 }
        }
      ]
    }
  ]
}
```

6. **Final Output** (With Costs):
```json
{
  "planId": "plan_123",
  "totalCost": 4800000,
  "dailyCosts": [1600000, 1800000, 1400000],
  "days": [...]
}
```

---

## 📈 Data Flow Performance Metrics

| Flow | Avg Latency | Data Size | Calls/Day |
|------|-------------|-----------|-----------|
| **User Login** | <200ms | 2 KB | 1,000 |
| **Incident Report** | <500ms | 50 KB (with image) | 500 |
| **AI Chat** | <2,000ms | 5 KB | 2,000 |
| **Travel Plan Gen** | <5,000ms | 50 KB | 200 |
| **Real-time Sync** | <100ms | 1 KB | 10,000 |

---

**Data Flow Diagram Version**: 1.0  
**Last Updated**: December 2025  
**Notation**: Yourdon-DeMarco DFD

