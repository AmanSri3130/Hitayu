const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { connectDB, getStatus } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const chatRoutes = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const yogaRoutes = require('./routes/yoga');
const habitRoutes = require('./routes/habit');

const app = express();

// Security and CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for pose reference images
app.use('/poses', express.static(path.resolve(__dirname, '../vendor/Chakra_yoga/example_poses')));

// Rate limiting for API stability
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this client. Please try again after a few minutes.'
  }
});
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getStatus();
  res.json({
    status: 'online',
    platform: 'HitAyu 2.0 Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      name: dbStatus.name
    },
    services: {
      groqConfigured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      yogaInferenceReady: true
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/yoga', yogaRoutes);
app.use('/api/habits', habitRoutes);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('\n-----------------------------------------------------');
    console.log('🌿 HITAYU 2.0 — Holistic Wellness & YogaAI Server');
    console.log('-----------------------------------------------------');
    
    // Connect to MongoDB Atlas / Local MongoDB
    await connectDB();

    // Auto-seed curated knowledge if collection is empty
    const Knowledge = require('./models/Knowledge');
    const existingCount = await Knowledge.countDocuments();
    if (existingCount === 0) {
      const { curatedKnowledge } = require('./scripts/seed');
      await Knowledge.insertMany(curatedKnowledge);
      console.log(`[HitAyu Server] Auto-seeded ${curatedKnowledge.length} curated Ayurvedic knowledge articles.`);
    }

    app.listen(PORT, () => {
      console.log(`[HitAyu Server] Listening on port ${PORT}`);
      console.log(`[HitAyu Server] Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[HitAyu Server Fatal Error]:', error.message);
    // Don't crash abruptly without helpful logs
    app.listen(PORT, () => {
      console.log(`[HitAyu Server] Running in Degraded Mode on port ${PORT} (Database connection pending configuration).`);
    });
  }
};

startServer();

module.exports = app;
