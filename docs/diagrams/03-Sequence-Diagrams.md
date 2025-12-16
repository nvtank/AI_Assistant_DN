# Sequence Diagrams

## 🔄 Detailed System Flows

Tài liệu này mô tả các luồng xử lý chính trong hệ thống GrabTheBeyond thông qua Sequence Diagrams.

---

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    User->>NextJS: Login
    NextJS->>Firebase: Authenticate
    Firebase-->>NextJS: JWT Token
    NextJS->>Firestore: Create/Update user
    NextJS-->>User: Success + Redirect
```

---

## 2. Report Incident Flow

```mermaid
sequenceDiagram
    User->>Client: Fill form + Upload image
    Client->>API: POST /api/incidents
    API->>Cloudinary: Upload image
    API->>Firestore: Save incident
    API->>SocketIO: Broadcast event
    SocketIO-->>OtherUsers: New incident
    API-->>User: Success
```

---

## 3. AI Chatbot Flow

```mermaid
sequenceDiagram
    User->>Chat: Send message
    Chat->>API: POST /api/chat
    API->>Gemini: Generate response
    
    alt Need Places
        Gemini-->>API: searchPlaces()
        API->>GooglePlaces: Query
        GooglePlaces-->>API: Results
        API->>Gemini: Places data
    end
    
    Gemini-->>API: Response
    API-->>User: Display + PlaceCards
```

---

## 4. Travel Plan Generation

```mermaid
sequenceDiagram
    User->>Form: Fill preferences
    Form->>API: Generate plan
    API->>Gemini: Create itinerary
    Gemini-->>API: Raw plan
    API->>Places: Enrich details
    API->>Firestore: Save plan
    API-->>User: Show itinerary
```

---

## 5. Real-time Incident Updates Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant AdminUI as Admin Dashboard
    participant NextAPI as Next.js API
    participant Firestore
    participant Listener as Firestore Listener
    participant UserUI as User Map View

    Admin->>AdminUI: Click "Resolve Incident"
    AdminUI->>NextAPI: PATCH /api/incidents/{id}
    activate NextAPI
    
    NextAPI->>NextAPI: Verify admin role
    NextAPI->>Firestore: Update incident document
    activate Firestore
    Firestore-->>Firestore: Trigger onSnapshot
    Firestore-->>Listener: Document changed event
    deactivate Firestore
    
    Listener->>UserUI: onSnapshot callback
    UserUI->>UserUI: Update incident marker
    UserUI->>UserUI: Change marker color (green)
    
    NextAPI-->>AdminUI: { success: true }
    deactivate NextAPI
    AdminUI-->>Admin: Show success toast
    UserUI-->>User: Updated marker on map
```

---

## 6. Online Users Tracking Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant OnlineService as Online Users Service
    participant Firestore
    participant Listener as Real-time Listener
    participant UI as User Count UI

    User->>Browser: Login success
    Browser->>OnlineService: markUserOnline(userId)
    OnlineService->>Firestore: SET online_users/{userId}
    Firestore-->>OnlineService: Success
    OnlineService->>OnlineService: startHeartbeat()
    
    loop Every 20 seconds
        OnlineService->>Firestore: UPDATE lastSeen timestamp
    end
    
    Browser->>Listener: listenToOnlineUsers(callback)
    Listener->>Firestore: onSnapshot(online_users)
    
    loop Real-time updates
        Firestore-->>Listener: Snapshot event
        Listener->>Listener: Filter active users (lastSeen < 30s)
        Listener->>Listener: Count users
        Listener-->>UI: callback(count)
        UI->>UI: Update "👥 X users online"
    end
    
    User->>Browser: Close tab / Logout
    Browser->>Browser: beforeunload event
    Browser->>Browser: navigator.sendBeacon()
    Browser->>NextAPI: POST /api/users/offline
    NextAPI->>Firestore: DELETE online_users/{userId}
    Firestore-->>Listener: User removed
    Listener-->>UI: Decrease count
```

---

## 7. Grab Integration Flow

```mermaid
sequenceDiagram
    actor User
    participant Chat as AI Chatbot
    participant PlaceCard
    participant Browser
    participant GrabApp as Grab Mobile App
    participant GrabAPI as Grab Backend

    User->>Chat: "Find restaurants near My Khe Beach"
    Chat->>Chat: AI returns restaurants
    Chat-->>User: Display PlaceCards
    
    User->>PlaceCard: Click "Book Grab"
    PlaceCard->>PlaceCard: Get user location
    PlaceCard->>PlaceCard: Format deep link URL
    
    Note over PlaceCard: grab://open?<br/>screen=booking&<br/>pickup_latitude=16.0544&<br/>pickup_longitude=108.2022&<br/>dropoff_latitude=16.0471&<br/>dropoff_longitude=108.2427
    
    PlaceCard->>Browser: window.location.href = deepLink
    Browser->>Browser: Detect Grab app installed?
    
    alt Grab App Installed
        Browser->>GrabApp: Launch with deep link
        GrabApp->>GrabApp: Parse pickup & dropoff
        GrabApp->>GrabAPI: Get fare estimate
        GrabAPI-->>GrabApp: Fare options
        GrabApp-->>User: Show booking screen
        User->>GrabApp: Confirm booking
    else Grab Not Installed
        Browser->>Browser: Redirect to Play Store / App Store
        Browser-->>User: "Install Grab app"
    end
```

---

## 8. Error Handling Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant NextAPI as Next.js API
    participant Service
    participant External as External API
    participant ErrorBoundary as Error Boundary

    User->>UI: Perform action
    UI->>NextAPI: API request
    
    alt Network Error
        NextAPI-XExternal: Request timeout
        External--XNextAPI: No response
        NextAPI-->>UI: { error: "Network timeout" }
        UI->>UI: Show retry button
        UI-->>User: Error toast
    else API Error
        NextAPI->>External: API call
        External-->>NextAPI: 500 Internal Server Error
        NextAPI->>NextAPI: Log error
        NextAPI-->>UI: { error: "Service unavailable" }
        UI-->>User: Fallback UI
    else Validation Error
        UI->>NextAPI: Invalid data
        NextAPI->>NextAPI: Validate input
        NextAPI-->>UI: { error: "Invalid input", fields: [...] }
        UI->>UI: Highlight error fields
        UI-->>User: Show validation errors
    else Unexpected Error
        Service->>Service: Crash!
        Service->>ErrorBoundary: Throw error
        ErrorBoundary->>ErrorBoundary: componentDidCatch()
        ErrorBoundary->>ErrorBoundary: Log to console
        ErrorBoundary-->>User: Show error page
        User->>ErrorBoundary: Click "Reload"
        ErrorBoundary->>Browser: window.location.reload()
    end
```

---

## 9. Admin Dashboard - Incident Management

```mermaid
sequenceDiagram
    actor Admin
    participant Dashboard as Admin Dashboard
    participant NextAPI as Next.js API
    participant Firestore
    participant ExcelExport as Excel Service
    participant Browser

    Admin->>Dashboard: Login as admin
    Dashboard->>NextAPI: GET /api/incidents?all=true
    NextAPI->>Firestore: Query all incidents
    Firestore-->>NextAPI: Incidents array
    NextAPI-->>Dashboard: { incidents }
    Dashboard->>Dashboard: Render incident table
    
    Admin->>Dashboard: Filter by category
    Dashboard->>Dashboard: Client-side filter
    Dashboard-->>Admin: Show filtered results
    
    Admin->>Dashboard: Click "Export to Excel"
    Dashboard->>ExcelExport: generateIncidentReport(incidents)
    ExcelExport->>ExcelExport: Create XLSX workbook
    ExcelExport->>ExcelExport: Add statistics sheet
    ExcelExport->>ExcelExport: Add incidents sheet
    ExcelExport-->>Dashboard: XLSX Blob
    Dashboard->>Browser: Trigger download
    Browser-->>Admin: Save "incidents_report_2025-12-16.xlsx"
    
    Admin->>Dashboard: Click incident row
    Dashboard->>Dashboard: Show incident details modal
    Admin->>Dashboard: Change status to "resolved"
    Dashboard->>NextAPI: PATCH /api/incidents/{id}
    NextAPI->>Firestore: Update status
    Firestore-->>NextAPI: Success
    NextAPI-->>Dashboard: { success }
    Dashboard-->>Admin: Show success message
```

---

## 10. First-Time User Onboarding

```mermaid
sequenceDiagram
    actor User
    participant Landing as Landing Page
    participant SignUp as Signup Form
    participant FirebaseAuth as Firebase Auth
    participant Firestore
    participant Welcome as Welcome Tour
    participant Dashboard

    User->>Landing: Visit website
    Landing-->>User: Show features
    User->>Landing: Click "Get Started"
    Landing-->>User: Navigate to /signup
    
    User->>SignUp: Enter email, password, name
    SignUp->>SignUp: Validate password strength
    SignUp->>FirebaseAuth: createUserWithEmailAndPassword()
    FirebaseAuth-->>SignUp: User UID
    
    SignUp->>FirebaseAuth: updateProfile({ displayName })
    SignUp->>Firestore: Create users/{uid} document
    Firestore-->>SignUp: Success
    
    SignUp->>SignUp: Set onboarding flag
    SignUp-->>User: Redirect to dashboard
    
    Dashboard->>Dashboard: Check if first visit
    Dashboard->>Welcome: Show welcome tour
    Welcome-->>User: Interactive tutorial
    
    User->>Welcome: Complete tour steps
    Welcome->>Firestore: Update user preferences
    Welcome-->>Dashboard: Close tour
    Dashboard-->>User: Show main interface
```

---

**Sequence Diagrams Version**: 1.0  
**Last Updated**: December 2025  
**UML Standard**: UML 2.5

