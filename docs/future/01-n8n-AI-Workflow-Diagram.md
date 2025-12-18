# n8n AI Workflow Diagrams - GrabTheBeyond

**Mục đích:** Sơ đồ chi tiết về cách sử dụng n8n để xây dựng AI workflows không cần code

---

## 📋 Mục Lục

1. [AI Image Classification Workflow](#ai-image-classification-workflow)
2. [Travel Plan Generation Agent](#travel-plan-generation-agent)
3. [Model Training Pipeline](#model-training-pipeline)
4. [Incident Auto-Verification Workflow](#incident-auto-verification-workflow)

---

## 🤖 AI Image Classification Workflow

### Tổng Quan

Workflow này tự động phân tích hình ảnh từ báo cáo sự cố, phân loại loại sự cố và mức độ nghiêm trọng, sau đó tự động duyệt hoặc gửi đến admin để xem xét.

### Sơ Đồ Workflow

```mermaid
flowchart TD
    Start[n8n Workflow Trigger<br/>Webhook từ Firebase Function<br/>New incident report với image] --> N1[Node 1: Extract Image Data<br/>HTTP Request<br/>GET image from Firebase Storage]
    N1 --> N2[Node 2: Image Preprocessing<br/>Code Node Python/JS<br/>Resize 224x224<br/>Normalize pixels<br/>Extract EXIF data]
    N2 --> N3[Node 3: AI Model Inference<br/>HTTP Request to ML API<br/>POST /predict<br/>Send base64 image]
    N3 --> N4{Node 4: Decision Logic<br/>IF Node Conditional}
    
    N4 -->|confidence >= 0.85<br/>AND severity = critical| Auto[AUTO-APPROVE]
    N4 -->|confidence >= 0.70| Priority[PRIORITY REVIEW]
    N4 -->|confidence < 0.70| Manual[MANUAL REVIEW]
    
    Auto --> N5[Node 5: Update Firebase<br/>HTTP Request Firebase REST API<br/>Update incident status<br/>Store AI analysis<br/>Set verified: true]
    Priority --> N5
    Manual --> N5
    
    N5 --> N6[Node 6: Broadcast Notification<br/>HTTP Request Socket.IO<br/>Emit incident:new event<br/>Send push notification<br/>Update admin dashboard]
    
    style Start fill:#e1f5ff
    style N1 fill:#fff4e1
    style N2 fill:#fff4e1
    style N3 fill:#fff4e1
    style N4 fill:#ffe1f5
    style Auto fill:#d4edda
    style Priority fill:#fff3cd
    style Manual fill:#f8d7da
    style N5 fill:#e1f5ff
    style N6 fill:#e1f5ff
```

### Chi Tiết Các Nodes

#### Node 1: Extract Image Data
```javascript
// n8n Code Node
const imageUrl = $input.item.json.imageUrl;
const incidentId = $input.item.json.incidentId;

return {
  json: {
    imageUrl,
    incidentId,
    timestamp: new Date().toISOString()
  }
};
```

#### Node 2: Image Preprocessing
```python
# n8n Python Code Node (hoặc HTTP request đến preprocessing service)
import base64
import requests
from PIL import Image
import io

def preprocess_image(image_url):
    # Download image
    response = requests.get(image_url)
    img = Image.open(io.BytesIO(response.content))
    
    # Resize và normalize
    img = img.resize((224, 224))
    # ... preprocessing logic
    
    return {
        'processed_image': base64.b64encode(img_bytes).decode(),
        'metadata': extract_metadata(img)
    }
```

#### Node 3: AI Model Inference
```javascript
// n8n HTTP Request Node
{
  "method": "POST",
  "url": "https://model-api.grabthebeyond.com/predict",
  "body": {
    "image": "{{ $json.processed_image }}",
    "metadata": "{{ $json.metadata }}"
  },
  "headers": {
    "Authorization": "Bearer {{ $env.MODEL_API_KEY }}"
  }
}
```

#### Node 4: Decision Logic
```javascript
// n8n IF Node Conditions
const confidence = $json.confidence;
const severity = $json.severity;

// Condition 1: Auto-approve
if (confidence >= 0.85 && severity === "critical") {
  return { route: "auto_approve" };
}

// Condition 2: Priority review
if (confidence >= 0.70) {
  return { route: "priority_review" };
}

// Default: Manual review
return { route: "manual_review" };
```

---

## 🧳 Travel Plan Generation Agent

### Tổng Quan

AI Agent tự động tạo kế hoạch du lịch dựa trên yêu cầu người dùng, sử dụng n8n để orchestrate các bước.

### Sơ Đồ Workflow

```mermaid
flowchart TD
    Start[Trigger: Webhook<br/>Travel Planner Form<br/>TravelPlanRequest JSON] --> N1[Node 1: Parse Request<br/>Extract dates, budget, preferences<br/>Validate input]
    N1 --> N2[Node 2: Fetch Weather Forecast<br/>HTTP Request OpenWeather API<br/>Get 5-day forecast]
    N1 --> N3[Node 3: Query Google Places API<br/>HTTP Request Google Places<br/>Nearby Search<br/>Filter by preferences]
    
    N2 --> N4[Node 4: Prepare Context for AI<br/>Code Node<br/>Format weather data<br/>Format places data<br/>Create prompt template]
    N3 --> N4
    
    N4 --> N5[Node 5: Call Gemini AI<br/>HTTP Request Gemini API<br/>Send formatted prompt<br/>Include context<br/>Request JSON response]
    
    N5 --> N6[Node 6: Parse AI Response<br/>Code Node<br/>Parse day-by-day itinerary<br/>Extract activities, times, costs<br/>Validate format]
    
    N6 --> N7[Node 7: Calculate Costs & Times<br/>Code Node<br/>Calculate Grab costs<br/>Estimate travel times<br/>Sum total budget]
    
    N7 --> N8[Node 8: Save to Firestore<br/>HTTP Request Firebase REST API<br/>Create travel_plans document<br/>Link to user ID]
    
    N8 --> N9[Node 9: Send Notification<br/>Update UI via WebSocket<br/>Send email optional<br/>Log completion]
    
    N1 -.Error.-> Error[Error Handling<br/>Log error<br/>Notify admin<br/>Retry with backoff]
    N2 -.Error.-> Error
    N3 -.Error.-> Error
    N5 -.Error.-> Error
    
    style Start fill:#e1f5ff
    style N1 fill:#fff4e1
    style N2 fill:#fff4e1
    style N3 fill:#fff4e1
    style N4 fill:#fff4e1
    style N5 fill:#ffe1f5
    style N6 fill:#fff4e1
    style N7 fill:#fff4e1
    style N8 fill:#d4edda
    style N9 fill:#d4edda
    style Error fill:#f8d7da
```

### Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│  ERROR HANDLING BRANCH                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ IF any node fails:                                       │  │
│  │   1. Log error to monitoring service                     │  │
│  │   2. Send notification to admin                           │  │
│  │   3. Retry with exponential backoff (max 3 times)         │  │
│  │   4. If still fails: Return error to user                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Model Training Pipeline

### Tổng Quan

Workflow tự động thu thập dữ liệu mới, gán nhãn, và retrain model để cải thiện độ chính xác.

### Sơ Đồ Workflow

```mermaid
flowchart TD
    Start[Trigger: Scheduled Daily 2 AM<br/>OR Manual from Admin Dashboard] --> N1[Node 1: Collect New Images<br/>HTTP Request Firebase Firestore<br/>Query incidents with new images<br/>Filter last 7 days<br/>Download images]
    N1 --> N2[Node 2: Auto-Labeling<br/>HTTP Request Model API<br/>Run inference on new images<br/>Get predictions with confidence<br/>Filter high-confidence >0.90]
    N2 --> N3[Node 3: Human Review Queue<br/>Code Node<br/>Low-confidence → Review queue<br/>Send notification to admin<br/>Wait for human labels]
    N3 --> N4[Node 4: Prepare Training Dataset<br/>Code Node<br/>Merge auto-labeled + human-labeled<br/>Split train/val/test 70/15/15<br/>Augment data]
    N4 --> N5[Node 5: Train Model<br/>HTTP Request Training Service<br/>Upload dataset<br/>Start training job<br/>Monitor progress]
    N5 --> N6[Node 6: Evaluate Model<br/>HTTP Request Evaluation API<br/>Run on test set<br/>Calculate metrics<br/>Compare with current model]
    N6 --> N7{Node 7: A/B Testing Decision<br/>IF new accuracy > current + 2%}
    N7 -->|Yes| DeployStaging[Deploy to Staging<br/>Run A/B test 10% traffic]
    N7 -->|No| KeepCurrent[Keep Current Model<br/>Archive new model]
    DeployStaging --> N8{Node 8: Deploy Best Model<br/>IF A/B test successful<br/>after 7 days}
    N8 -->|Yes| DeployProd[Deploy to Production<br/>Update model version<br/>Notify team]
    N8 -->|No| KeepCurrent
    
    style Start fill:#e1f5ff
    style N1 fill:#fff4e1
    style N2 fill:#fff4e1
    style N3 fill:#fff4e1
    style N4 fill:#fff4e1
    style N5 fill:#ffe1f5
    style N6 fill:#fff4e1
    style N7 fill:#ffe1f5
    style DeployStaging fill:#fff3cd
    style N8 fill:#ffe1f5
    style DeployProd fill:#d4edda
    style KeepCurrent fill:#f8d7da
```

---

## ✅ Incident Auto-Verification Workflow

### Chi Tiết Workflow

Workflow này kết hợp nhiều nguồn dữ liệu để tự động xác minh sự cố:

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT: New Incident Report                                      │
│  - Image, Location, Description, User Info                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Image        │ │ Location     │ │ User         │
│ Analysis     │ │ Validation   │ │ Reputation   │
│ (AI Model)   │ │ (Weather API)│ │ (History)    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └───────────────┼────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  NODE: Multi-Source Verification                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Combine scores:                                           │  │
│  │ - AI confidence: 0.92                                     │  │
│  │ - Location match: 0.95 (weather confirms rain)          │  │
│  │ - User reputation: 0.88 (10 verified reports)           │  │
│  │                                                           │  │
│  │ Weighted score: 0.92 * 0.5 + 0.95 * 0.3 + 0.88 * 0.2   │  │
│  │ = 0.916 (91.6% confidence)                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  DECISION: Auto-approve (confidence > 0.90)                    │
│  → Update status, broadcast, notify users                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 n8n Configuration

### Environment Variables

```bash
# API Keys
GOOGLE_PLACES_API_KEY=xxx
GEMINI_API_KEY=xxx
MODEL_API_KEY=xxx
FIREBASE_SERVICE_ACCOUNT=xxx

# Endpoints
MODEL_API_URL=https://model-api.grabthebeyond.com
FIREBASE_URL=https://firestore.googleapis.com/v1
SOCKET_IO_URL=https://backend.grabthebeyond.com
```

### Webhook URLs

- **Image Classification**: `https://n8n.grabthebeyond.com/webhook/incident-classify`
- **Travel Plan Generation**: `https://n8n.grabthebeyond.com/webhook/travel-plan`
- **Model Training**: `https://n8n.grabthebeyond.com/webhook/train-model`

---

## 📊 Monitoring & Analytics

### Metrics to Track

- Workflow execution time
- Success/failure rates
- AI model accuracy
- Cost per workflow execution
- User satisfaction scores

### Dashboards

- n8n execution dashboard
- Model performance dashboard
- Cost tracking dashboard

---

**Cập nhật lần cuối:** December 2025
