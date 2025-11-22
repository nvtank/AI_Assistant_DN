# Grab The Beyond 🚗🌟

**Real-time Incident Map + Context-Aware AI Chatbot + Grab Integration**

Dự án MVP hoàn chỉnh cho hackathon Grab, tích hợp 3 tính năng cốt lõi:

## 🎯 Tính năng chính

### 1. 🗺️ Bản đồ Sự cố Thời gian thực (Real-time Incident Map)
- Hiển thị các sự cố: Ngập lụt 🌊, Ổ gà 🕳️, Thi công 🚧, Kẹt xe 🚗
- User báo cáo sự cố kèm ảnh chụp
- Admin xác nhận → Đẩy thông báo realtime qua Socket.IO
- Công nghệ: **Leaflet**, **Socket.IO**, **Firebase**

### 2. 🤖 Chatbot AI "Thổ địa" (Context-Aware AI)
- Hiểu ngữ cảnh: Vị trí GPS + Thời tiết + Sự cố gần đó
- Gợi ý địa điểm thông minh dựa trên điều kiện thực tế
- Công nghệ: **Puter AI** (GPT, Claude, Gemini - MIỄN PHÍ!), **Prompt Engineering**

### 3. 🚗 Điều hướng thông minh tích hợp Grab
- Card địa điểm với nút [Đặt GrabCar]
- Tự động mở app Grab với điểm đi/đến đã điền
- Deep linking: `grab://open?...`

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình Environment Variables
Sao chép `.env.example` thành `.env` và điền thông tin:

```bash
cp .env.example .env
```

Cần cấu hình:
- **Firebase**: Tạo project tại [console.firebase.google.com](https://console.firebase.google.com)
- **Puter AI**: MIỄN PHÍ - không cần API key! (tích hợp sẵn)
- **OpenWeatherMap**: Lấy API key tại [openweathermap.org](https://openweathermap.org/api)

### 3. Chạy dự án

#### Chạy development mode (Frontend + Backend cùng lúc):
```bash
npm run dev:all
```

Hoặc chạy riêng:

**Frontend (Next.js):**
```bash
npm run dev
```

**Backend (Node.js + Socket.IO):**
```bash
npm run server
```

### 4. Truy cập ứng dụng
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

## 📁 Cấu trúc dự án

```
GrabTheBeyond/
├── components/           # React Components
│   ├── IncidentMap.tsx  # Bản đồ Leaflet với markers
│   ├── ReportIncidentForm.tsx  # Form báo cáo sự cố
│   ├── AIChatbot.tsx    # Chatbot AI
│   └── PlaceCard.tsx    # Card địa điểm + nút Grab
├── lib/                 # Utilities & Types
│   ├── firebase.ts      # Firebase config
│   ├── socket.ts        # Socket.IO client
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Helper functions
├── pages/               # Next.js pages
│   ├── index.tsx        # Homepage chính
│   ├── _app.tsx         # App wrapper
│   └── _document.tsx    # HTML document
├── server/              # Backend Node.js
│   └── index.js         # Express + Socket.IO server
├── styles/              # CSS
│   └── globals.css      # Global styles
└── public/              # Static files
```

## 🔧 Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js + Express** - REST API server
- **Socket.IO** - WebSocket for real-time
- **Firebase Admin** - Database & storage
- **Multer** - File upload handling

### AI & APIs
- **Puter AI** - FREE AI chatbot (GPT-5 nano, Claude, Gemini)
- **OpenWeatherMap API** - Weather data
- **Nominatim (OSM)** - Reverse geocoding

### Integration
- **Grab Deep Linking** - Direct app integration

## 📱 Tính năng nổi bật

### Real-time Updates ⚡
- Sự cố được broadcast ngay lập tức tới tất cả users
- Hiển thị số người đang online
- Notifications khi có sự cố mới

### Context-Aware AI 🧠
- AI biết vị trí hiện tại của user
- AI check thời tiết realtime
- AI lọc địa điểm phù hợp (trong nhà khi mưa, v.v.)

### Smart Navigation 🗺️
- One-tap để mở Grab app
- Auto-fill điểm đi/đến
- Fallback sang web nếu không có app

## 🎨 UI/UX Highlights

- ✨ Modern, clean interface với Grab branding
- 📱 Fully responsive (mobile-first)
- 🎯 Intuitive map interactions
- 💬 Conversational AI chat
- 🚀 Fast loading với dynamic imports

## 🔐 Security & Best Practices

- ✅ Environment variables cho sensitive data
- ✅ Firebase Admin SDK cho server-side operations
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Error handling & logging

## 📝 Notes cho Hackathon

### MVP Focus
Dự án tập trung vào 3 tính năng cốt lõi hoạt động mượt mà, thay vì làm nhiều tính năng nhưng chưa hoàn thiện.

### Demo Scenarios
1. **User reports incident** → Real-time broadcast → AI suggests alternatives
2. **User asks "Where to go in rain?"** → AI analyzes weather + incidents → Suggests indoor places
3. **User clicks "Book Grab"** → Opens Grab app with pre-filled destination

### Potential Extensions
- [ ] Admin dashboard để verify incidents
- [ ] Historical data & analytics
- [ ] User authentication & profiles
- [ ] Rating system cho địa điểm
- [ ] Push notifications (FCM)
- [ ] Offline mode với Service Workers

## 🤝 Contributing

Dự án mở cho contributions. Tạo PR hoặc mở issue nếu có ý tưởng!

## 📄 License

MIT License - Free to use for hackathon & learning purposes

## 🙏 Credits

- **Grab** - Branding & inspiration
- **OpenStreetMap** - Map data
- **Puter** - AI capabilities
- **Firebase** - Backend infrastructure

---

**Built with ❤️ for Grab Hackathon 2025**

🚗 *"Beyond Transportation, Beyond Limits"* 🌟
