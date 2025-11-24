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

## 📁 Project Structure

```
GrabTheBeyond/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── login/                   # Authentication pages
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── globals.css              # Global styles
├── components/                   # React Components
│   ├── AIChatbot.tsx            # Context-aware AI chatbot
│   ├── AuthProvider.tsx         # Authentication context
│   ├── IncidentMap.tsx          # Interactive Leaflet map
│   ├── PlaceCard.tsx            # Destination card with Grab button
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   ├── ReportIncidentForm.tsx   # Incident reporting form
│   └── UserMenu.tsx             # User profile menu
├── lib/                          # Core libraries & utilities
│   ├── authService.ts           # Firebase authentication
│   ├── firebase.ts              # Firebase configuration
│   ├── placesAPI.ts             # Google Places integration
│   ├── puterAI.ts               # Puter AI service
│   ├── socket.ts                # Socket.IO client
│   ├── types.ts                 # TypeScript definitions
│   └── utils.ts                 # Helper functions
├── server/                       # Backend API
│   └── index.js                 # Express + Socket.IO server
├── uploads/                      # User-uploaded files
│   └── incidents/               # Incident photos
└── public/                       # Static assets
```

## �️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| [Next.js](https://nextjs.org/) | React framework with App Router | 14.0.4 |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript | 5.3.3 |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework | 3.4.0 |
| [Leaflet](https://leafletjs.com/) | Interactive map library | 1.9.4 |
| [React Leaflet](https://react-leaflet.js.org/) | React wrapper for Leaflet | 4.2.1 |
| [Socket.IO Client](https://socket.io/) | Real-time WebSocket client | 4.6.1 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| [Node.js](https://nodejs.org/) | JavaScript runtime | - |
| [Express](https://expressjs.com/) | Web application framework | 4.18.2 |
| [Socket.IO](https://socket.io/) | Real-time bidirectional communication | 4.6.1 |
| [Multer](https://github.com/expressjs/multer) | File upload middleware | 1.4.5-lts.1 |
| [CORS](https://github.com/expressjs/cors) | Cross-origin resource sharing | 2.8.5 |

### Database & Authentication
| Technology | Purpose | Version |
|-----------|---------|---------|
| [Firebase](https://firebase.google.com/) | Backend-as-a-Service | 10.14.1 |
| [Firebase Admin](https://firebase.google.com/docs/admin/setup) | Server-side Firebase SDK | 12.0.0 |
| [Firestore](https://firebase.google.com/docs/firestore) | NoSQL cloud database | - |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Authentication service | - |
| [Firebase Storage](https://firebase.google.com/docs/storage) | File storage service | - |

### External APIs
| Service | Purpose | Documentation |
|---------|---------|---------------|
| [Puter AI](https://puter.com/) | Multi-model AI (GPT-5 nano, Claude, Gemini) | [Docs](https://docs.puter.com/) |
| [OpenWeatherMap](https://openweathermap.org/) | Real-time weather data | [API Docs](https://openweathermap.org/api) |
| [Google Places](https://developers.google.com/maps/documentation/places) | Location search and details | [API Docs](https://developers.google.com/maps/documentation) |
| [Nominatim](https://nominatim.org/) | Reverse geocoding | [API Docs](https://nominatim.org/release-docs/develop/api/Overview/) |

### Integrations
- **Grab Deep Linking**: Native app integration via custom URL scheme (`grab://`)
- **Google OAuth**: Social authentication via Firebase
- **Facebook OAuth**: Social authentication via Firebase

## 🎯 Core Functionalities

### 1. Real-time Incident Management ⚡
```typescript
// Features:
- Live incident broadcasting via WebSocket
- Photo upload with Firebase Storage
- Map marker clustering for better UX
- Admin verification workflow
- Online user counter
- Automatic notifications for nearby incidents
```

### 2. Context-Aware AI Assistant 🧠
```typescript
// AI considers:
- User's current GPS coordinates
- Real-time weather conditions
- Nearby reported incidents
- Time of day
- User preferences

// Provides:
- Intelligent venue recommendations
- Weather-appropriate suggestions
- Incident-aware routing advice
- Local insights and tips
```

### 3. Seamless Grab Integration �
```typescript
// Functionality:
- One-tap booking with deep linking
- Pre-filled origin and destination
- Automatic app detection
- Web fallback for non-app users
- Distance and ETA calculation
```

### 4. User Authentication & Management 🔐
```typescript
// Supported methods:
- Email/Password registration
- Google OAuth 2.0
- Facebook OAuth 2.0
- Session persistence
- Protected routes
- User profile management
```

## 🎨 UI/UX Features

- ✨ **Modern Design**: Clean interface with Grab's brand identity
- 📱 **Fully Responsive**: Mobile-first design, works on all devices
- 🗺️ **Interactive Maps**: Smooth pan, zoom, and marker interactions
- 💬 **Natural Conversations**: AI chatbot with conversational UI
- 🚀 **Performance Optimized**: Code splitting and lazy loading
- ♿ **Accessible**: WCAG 2.1 compliant design principles
- 🌓 **Visual Feedback**: Loading states, animations, and transitions

## � Security & Best Practices

### Authentication & Authorization
- ✅ Firebase Authentication with email verification
- ✅ OAuth 2.0 for social logins
- ✅ JWT-based session management
- ✅ Protected API endpoints
- ✅ Route guards for authenticated pages

### Data Security
- ✅ Environment variables for sensitive data
- ✅ Firebase Security Rules for Firestore
- ✅ Server-side validation with Firebase Admin SDK
- ✅ Input sanitization and validation
- ✅ HTTPS-only in production

### Code Quality
- ✅ TypeScript for type safety
- ✅ ESLint for code linting
- ✅ Error boundaries for graceful error handling
- ✅ Comprehensive error logging
- ✅ CORS configuration for API security

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
