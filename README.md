# AI Assistant 
> **Smart Tourism Platform for Da Nang, Vietnam**  
> Real-time Incident Reporting • Context-Aware AI Assistant • Seamless Grab Integration

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.14-orange?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive MVP platform built for Grab Hackathon 2025, combining real-time incident management, intelligent AI recommendations, and seamless ride-hailing integration to enhance the tourism experience in Da Nang.


## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/GrabTheBeyond.git
   cd GrabTheBeyond
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the root directory:
   ```bash
   cp .env
   ```

   Configure the following environment variables:

   ```env
   # Firebase Configuration (Required)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin SDK (Server-side - Required)
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Gemini AI API Key (Required for AI Chatbot)
   # Note: Must have NEXT_PUBLIC_ prefix for client-side access
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

   # Weather API (Required)
   OPENWEATHER_API_KEY=your_openweather_api_key

   # Google Places API (Required for venue search)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

   # Backend Server Configuration
   PORT=3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

   # Grab Deep Link Scheme
   GRAB_DEEP_LINK_SCHEME=grab://
   ```

### Running the Application

#### Development Mode (Recommended)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This starts:
- **Frontend** (Next.js): http://localhost:3000
- **Backend** (Express + Socket.IO): http://localhost:3001

#### Or Run Separately

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run server
```

### Building for Production

```bash
# Build the Next.js application
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
GrabTheBeyond/
├── 📱 app/                           # Next.js 14 App Router
│   ├── layout.tsx                   # Root layout with AuthProvider
│   ├── page.tsx                     # Home page (Map + Chatbot)
│   ├── login/
│   │   └── page.tsx                 # Login page (Email, Google, Facebook)
│   ├── signup/
│   │   └── page.tsx                 # Registration page
│   ├── profile/
│   │   └── page.tsx                 # User profile (Protected route)
│   └── globals.css                  # Global styles & Tailwind imports
│
├── 🧩 components/                    # Reusable React Components
│   ├── AIChatbot.tsx                # Context-aware AI assistant
│   ├── AuthProvider.tsx             # Firebase Auth context provider
│   ├── IncidentMap.tsx              # Interactive Leaflet map
│   ├── PlaceCard.tsx                # Venue card with Grab integration
│   ├── ProtectedRoute.tsx           # Authentication guard HOC
│   ├── ReportIncidentForm.tsx       # Incident reporting modal
│   └── UserMenu.tsx                 # User dropdown menu
│
├── 📚 lib/                           # Core Libraries & Services
│   ├── authService.ts               # Firebase Auth functions
│   ├── firebase.ts                  # Firebase initialization
│   ├── geminiAI.ts                  # Gemini AI service
│   ├── placesAPI.ts                 # Google Places integration
│   ├── socket.ts                    # Socket.IO client
│   ├── types.ts                     # TypeScript type definitions
│   └── utils.ts                     # Utility functions (location, distance)
│
├── 🖥️ server/                        # Backend API Server
│   └── index.js                     # Express + Socket.IO + Multer
│
├── 📤 uploads/                       # User-uploaded files (gitignored)
│   └── incidents/                   # Incident photos
│
├── 📄 Documentation Files
│   ├── FIREBASE_AUTH_SETUP.md       # Firebase authentication guide
│   ├── FACEBOOK_LOGIN_CHECKLIST.md  # Facebook OAuth setup
│   ├── GEMINI_API_KEY_FIX.md        # Gemini API troubleshooting
│   └── IP_GEOLOCATION_UPDATE.md     # Location fallback guide
│
└── ⚙️ Configuration Files
    ├── next.config.js               # Next.js configuration
    ├── tailwind.config.js           # Tailwind CSS configuration
    ├── tsconfig.json                # TypeScript configuration
    ├── package.json                 # Dependencies & scripts
    └── .env                         # Environment variables (not in git)
```

---

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org/) | 14.0.4 | React framework with App Router & Server Components |
| [React](https://react.dev/) | 18.2.0 | UI library for building interactive interfaces |
| [TypeScript](https://www.typescriptlang.org/) | 5.3.3 | Type-safe JavaScript with static typing |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.0 | Utility-first CSS framework |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Open-source interactive maps |
| [React Leaflet](https://react-leaflet.js.org/) | 4.2.1 | React components for Leaflet |
| [Socket.IO Client](https://socket.io/) | 4.6.1 | Real-time WebSocket communication |

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | JavaScript runtime environment |
| [Express](https://expressjs.com/) | 4.18.2 | Minimal web application framework |
| [Socket.IO](https://socket.io/) | 4.6.1 | Real-time bidirectional event-based communication |
| [Multer](https://github.com/expressjs/multer) | 1.4.5 | Middleware for handling `multipart/form-data` |
| [CORS](https://github.com/expressjs/cors) | 2.8.5 | Cross-Origin Resource Sharing middleware |

### Database & Authentication

| Service | Purpose | Features |
|---------|---------|----------|
| [Firebase](https://firebase.google.com/) | Backend-as-a-Service | Complete backend infrastructure |
| [Firestore](https://firebase.google.com/docs/firestore) | NoSQL database | Real-time data synchronization |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Authentication | Email, Google, Facebook login |
| [Firebase Storage](https://firebase.google.com/docs/storage) | File storage | Image upload for incidents |
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | Server-side operations | Secure backend administration |

### External APIs & Services

| Service | Purpose | Rate Limits | Documentation |
|---------|---------|-------------|---------------|
| [Google Gemini AI](https://ai.google.dev/) | Conversational AI | Varies by tier | [Docs](https://ai.google.dev/docs) |
| [Google Places API](https://developers.google.com/maps/documentation/places) | Venue search & details | Varies by plan | [API Docs](https://developers.google.com/maps/documentation) |
| [OpenWeatherMap](https://openweathermap.org/) | Real-time weather data | 1,000 calls/day (free) | [API Docs](https://openweathermap.org/api) |
| [ip-api.com](https://ip-api.com/) | IP geolocation | 45 req/min (free) | [Docs](https://ip-api.com/docs) |
| [Nominatim](https://nominatim.org/) | Reverse geocoding | 1 req/sec | [Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) |

---

### Testing Tools
```bash
# Check environment variables
node check-env-gemini.js

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 📚 Documentation

Comprehensive guides available:

| Guide | Description |
|-------|-------------|
| [FIREBASE_AUTH_SETUP.md](./FIREBASE_AUTH_SETUP.md) | Complete Firebase authentication setup |
| [FACEBOOK_LOGIN_CHECKLIST.md](./FACEBOOK_LOGIN_CHECKLIST.md) | Facebook OAuth configuration steps |
| [GEMINI_API_KEY_FIX.md](./GEMINI_API_KEY_FIX.md) | Troubleshooting Gemini API issues |
| [IP_GEOLOCATION_UPDATE.md](./IP_GEOLOCATION_UPDATE.md) | Location fallback implementation |


## 🙏 Acknowledgments

### Technologies & Services
- **Google** - Gemini AI, Places API, OAuth
- **Firebase** - Complete backend infrastructure
- **OpenStreetMap** - Map data via Leaflet
- **OpenWeatherMap** - Real-time weather data


## 📧 Contact & Support

**Project Repository:** [GitHub](https://github.com/yourusername/GrabTheBeyond)

**Issues & Bugs:** [GitHub Issues](https://github.com/yourusername/GrabTheBeyond/issues)

**Questions:** Open a discussion on GitHub

---


