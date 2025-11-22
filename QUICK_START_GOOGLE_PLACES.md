# 🚀 Quick Start - Google Places API (3 phút)

## Copy-paste commands:

### 1. Lấy API Key:
🔗 https://console.cloud.google.com/apis/credentials

### 2. Enable APIs cần thiết:
🔗 https://console.cloud.google.com/apis/library/places-backend.googleapis.com
🔗 https://console.cloud.google.com/apis/library/maps-backend.googleapis.com

### 3. Add vào .env:
```bash
echo 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE' >> .env
```

### 4. Test ngay:
```bash
npm run dev
```

Hỏi AI: "Tìm tiệm cắt tóc gần đây" ✂️

---

## Test commands:

```bash
# Test search cafe
curl "http://localhost:3001/api/places/nearby?location=16.0544,108.2022&type=cafe&radius=2000"

# Test search tiệm cắt tóc
curl "http://localhost:3001/api/places/nearby?location=16.0544,108.2022&type=hair_care&radius=2000"

# Test text search
curl "http://localhost:3001/api/places/textsearch?query=spa+danang"
```

Nếu thấy JSON response với "results": [...] → SUCCESS! ✅

