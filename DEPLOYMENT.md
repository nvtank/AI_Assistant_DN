# Deployment Guide - Findly AI Assistant

## 🚀 Deploy to Vercel

### Prerequisites
1. Vercel account
2. Firebase project
3. Gemini API key
4. OpenWeather API key
5. Pusher account

### Steps

#### 1. Environment Variables Setup
Add these environment variables in Vercel Dashboard:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=xxx

# OpenWeather
OPENWEATHER_API_KEY=xxx

# Pusher
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
PUSHER_APP_ID=xxx
PUSHER_SECRET=xxx
```

#### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication > Settings > Authorized domains**
4. Add your Vercel domains:
   - `your-app.vercel.app` (production)
   - `your-app-*.vercel.app` (preview deployments - add as needed)
   - `localhost` (for local development)

#### 3. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Common Issues & Solutions

#### ❌ Error: auth/unauthorized-domain
**Solution**: Add your Vercel domain to Firebase Authorized domains (see step 2 above)

#### ❌ Error: Mixed Content (HTTP vs HTTPS)
**Solution**: Already fixed - using HTTPS IP API (ipapi.co)

#### ❌ Error: WebSocket connection failed
**Solution**: Socket.IO is disabled in production. Using Pusher for real-time updates instead.

#### ❌ Error: Weather API returning HTML
**Solution**: Check that `OPENWEATHER_API_KEY` is set in Vercel environment variables

#### ❌ Error: Gemini AI response format
**Solution**: Already fixed - improved response parsing with multiple fallback paths

### Architecture Notes

- **Real-time Updates**: Using Pusher (not Socket.IO) because Vercel is serverless
- **Location API**: Using ipapi.co (HTTPS) instead of ip-api.com (HTTP)
- **Database**: Firebase Firestore for incidents, Storage for images
- **AI**: Gemini 2.5 Flash for chat responses
- **Maps**: Leaflet with OpenStreetMap tiles

### Monitoring

Check these in Vercel Dashboard:
- Function logs for API errors
- Runtime logs for client errors
- Analytics for performance

### Security Checklist

- ✅ All API keys in environment variables
- ✅ Firebase security rules configured
- ✅ HTTPS enforced for all external APIs
- ✅ CORS configured properly
- ✅ Rate limiting on API routes (via Vercel)

## 📱 Testing After Deployment

1. **Authentication**: Try login/signup with Google/email
2. **Map**: Check if map loads and shows incidents
3. **AI Chat**: Send a message, check Gemini response
4. **Weather**: Verify weather data displays
5. **Incident Reporting**: Try creating a new incident
6. **Real-time**: Create incident from admin, check if it appears on map
7. **Mobile**: Test on mobile device, check responsive design

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Then fill in your API keys

# Run development server
npm run dev
```

## 📊 Performance Tips

1. **Images**: Upload images < 5MB for faster load
2. **Caching**: Weather API cached for 10 minutes
3. **Lazy Loading**: Map loaded dynamically to reduce initial bundle
4. **Code Splitting**: Next.js automatic code splitting enabled

## 🆘 Support

If you encounter issues:
1. Check Vercel function logs
2. Check browser console for client errors
3. Verify all environment variables are set
4. Check Firebase quota limits
5. Verify API keys are valid

---

Built with ❤️ using Next.js 14, Firebase, Gemini AI, and Leaflet
