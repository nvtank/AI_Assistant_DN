require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Firebase Admin initialization (Optional)
let db = null;

if (!admin.apps.length) {
  try {
    if (
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
      db = admin.firestore();
      console.log('✅ Firebase initialized successfully');
    } else {
      console.log('⚠️  Firebase not configured - running with mock data');
    }
  } catch (error) {
    console.log('⚠️  Firebase initialization failed:', error.message);
  }
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/incidents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Connected users tracking
let connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  connectedUsers.add(socket.id);

  // Send current connected users count
  io.emit('users:count', connectedUsers.size);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('users:count', connectedUsers.size);
  });

  // Handle incident reports
  socket.on('incident:report', async (data) => {
    console.log('New incident reported:', data);
    
    try {
      if (db) {
        // Save to Firestore
        const incidentRef = await db.collection('incidents').add({
          ...data,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          reportedBy: socket.id
        });

        socket.emit('incident:reported', {
          success: true,
          incidentId: incidentRef.id
        });
      } else {
        // Mock response when Firebase not available
        const mockId = `mock_${Date.now()}`;
        socket.emit('incident:reported', {
          success: true,
          incidentId: mockId
        });
        // Broadcast immediately in demo mode
        io.emit('incident:new', { id: mockId, ...data });
      }
    } catch (error) {
      console.error('Error saving incident:', error);
      socket.emit('incident:reported', {
        success: false,
        error: error.message
      });
    }
  });

  // Handle incident verification (Admin only)
  socket.on('incident:verify', async (data) => {
    console.log('Incident verified:', data);
    
    try {
      const { incidentId, verified } = data;
      
      if (db) {
        // Update status in Firestore
        await db.collection('incidents').doc(incidentId).update({
          status: verified ? 'verified' : 'rejected',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          verifiedBy: socket.id
        });

        if (verified) {
          // Get full incident data
          const incidentDoc = await db.collection('incidents').doc(incidentId).get();
          const incidentData = { id: incidentDoc.id, ...incidentDoc.data() };

          // Broadcast to all connected users
          io.emit('incident:new', incidentData);
        }
      }

      socket.emit('incident:verified', {
        success: true,
        incidentId
      });
    } catch (error) {
      console.error('Error verifying incident:', error);
      socket.emit('incident:verified', {
        success: false,
        error: error.message
      });
    }
  });

  // Handle location updates
  socket.on('user:location', (location) => {
    socket.broadcast.emit('user:location:update', {
      userId: socket.id,
      location
    });
  });
});

// REST API Endpoints

// Get all verified incidents
app.get('/api/incidents', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('incidents')
        .where('status', '==', 'verified')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const incidents = [];
      snapshot.forEach(doc => {
        incidents.push({ id: doc.id, ...doc.data() });
      });

      res.json({ success: true, data: incidents });
    } else {
      // Return mock incidents when Firebase not available
      res.json({ 
        success: true, 
        data: [
          {
            id: 'mock1',
            type: 'flooding',
            location: { lat: 16.0544, lng: 108.2022 },
            severity: 'high',
            description: 'Ngập nước sau mưa lớn',
            timestamp: Date.now() - 3600000,
            status: 'verified'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload incident image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/incidents/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Weather API proxy
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const axios = require('axios');
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=vi`
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Chat endpoint (using Puter AI - FREE!)
// Note: Puter AI is called from the frontend, this endpoint just handles fallback
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userLocation, weather, nearbyIncidents, usePuter } = req.body;
    
    // If using Puter (from frontend), just return success
    // The actual Puter AI call is made from the client side
    if (usePuter) {
      return res.json({ 
        success: true, 
        usePuter: true,
        context: {
          location: userLocation,
          weather: weather,
          incidents: nearbyIncidents
        }
      });
    }

    // Fallback response if Puter is not available
    const aiResponse = generateFallbackResponse(message, userLocation, weather, nearbyIncidents);

    res.json({ success: true, response: aiResponse, useFallback: true });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback AI response generator (English prompts for better AI)
function generateFallbackResponse(message, userLocation, weather, nearbyIncidents) {
  const isRaining = weather?.main?.toLowerCase().includes('rain');
  const hasFlooding = nearbyIncidents?.some(i => i.type === 'flooding');
  const messageLower = message.toLowerCase();

  // Detect user's language
  const isVietnamese = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(message);

  // Weather-based responses
  if (isRaining || hasFlooding) {
    if (isVietnamese) {
      return `⛈️ Hiện tại trời đang mưa và có ${nearbyIncidents?.length || 0} sự cố gần bạn. Tôi khuyên bạn nên:
    
🏛️ Bảo tàng Chăm (800m) - Trong nhà, không sợ mưa
☕ Cộng Cà Phê Trần Phú (1.2km) - View đẹp, cozy
🛍️ Vincom Plaza (2km) - Mua sắm thoải mái
💆 Sky36 Spa (1.5km) - Thư giãn trong mưa

⚠️ Tránh: Bãi biển (sóng lớn), đường ngập nước

Đặt GrabCar ngay? 🚗`;
    } else {
      return `⛈️ It's raining with ${nearbyIncidents?.length || 0} incidents nearby. I recommend:
    
🏛️ Cham Museum (800m) - Indoor, dry & educational
☕ Cong Caphe Tran Phu (1.2km) - Beautiful view, cozy
🛍️ Vincom Plaza (2km) - Shopping & food court
💆 Sky36 Spa (1.5km) - Relax in the rain

⚠️ Avoid: Beaches (big waves), flooded streets

Book GrabCar now? 🚗`;
    }
  }

  // Keyword-based responses
  if (messageLower.includes('cắt tóc') || messageLower.includes('hair') || messageLower.includes('salon')) {
    if (isVietnamese) {
      return `✂️ Tiệm cắt tóc đẹp gần bạn:

💇 Hair Salon 30Shine (600m, 4.5★) - Nam, giá sinh viên
💁 Jean Hair Salon (900m, 4.7★) - Nữ, chuyên nhuộm
✨ Tony Khánh Salon (1.2km, 4.8★) - Cao cấp, styling

Giờ mở cửa: 8AM-10PM. Đặt GrabBike? 🏍️`;
    } else {
      return `✂️ Top hair salons near you:

💇 30Shine Hair Salon (600m, 4.5★) - Men's cuts, student prices
💁 Jean Hair Salon (900m, 4.7★) - Women's, coloring expert
✨ Tony Khánh Salon (1.2km, 4.8★) - Premium styling

Open: 8AM-10PM daily. Book GrabBike? 🏍️`;
    }
  }

  if (messageLower.includes('ăn') || messageLower.includes('food') || messageLower.includes('restaurant')) {
    if (isVietnamese) {
      return `🍜 Ăn gì ngon gần đây:

🦞 Bé Mặn Seafood (1.1km, 4.6★) - Hải sản tươi
🍖 Bếp Trang Restaurant (800m, 4.5★) - Món Việt
🍕 Pizza 4P's (1.5km, 4.7★) - Pizza phô mai burrata

Đặt bàn & GrabFood? 🚗`;
    } else {
      return `🍜 Best food options nearby:

🦞 Bé Mặn Seafood (1.1km, 4.6★) - Fresh catch daily
🍖 Bếp Trang Restaurant (800m, 4.5★) - Vietnamese cuisine
🍕 Pizza 4P's (1.5km, 4.7★) - Famous burrata cheese pizza

Reserve table & GrabFood? 🚗`;
    }
  }

  // Default sunny weather response
  if (isVietnamese) {
    return `☀️ Thời tiết đẹp! Gợi ý cho bạn:
  
🌊 Bãi biển Mỹ Khê (3km, 4.8★) - Bơi lội, lướt sóng
🏔️ Bán đảo Sơn Trà (5km, 4.7★) - Leo núi, ngắm khỉ
🌉 Cầu Rồng (1.5km, 4.7★) - Phun lửa T7-CN 9PM
☕ Rooftop cafe view biển - Nhiều quán đẹp!

Đặt Grab đi chơi? 🏍️`;
  } else {
    return `☀️ Beautiful weather in Da Nang! Try:
  
🌊 My Khe Beach (3km, 4.8★) - Swimming, surfing
🏔️ Son Tra Peninsula (5km, 4.7★) - Hiking, monkey watching
🌉 Dragon Bridge (1.5km, 4.7★) - Fire show Sat-Sun 9PM
☕ Rooftop cafes with ocean views - Many options!

Book Grab for adventure? 🏍️`;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
});
