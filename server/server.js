require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import route modules
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const requestRoutes = require('./routes/requestRoutes');
const fileRoutes = require('./routes/fileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
  // Auto-seed admin if database is initialized for the first time
  try {
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'instaprints@gmail.com';
      const hashedPassword = await bcrypt.hash('Instaprints@2026', 12);
      await Admin.create({
        email: defaultEmail.toLowerCase(),
        password: hashedPassword,
        lastLoginAt: null
      });
      console.log(`[Seed] Automatically ensured single fixed admin exists: ${defaultEmail}`);
    }
  } catch (seedErr) {
    console.warn('[Seed Check Warning]:', seedErr.message);
  }
});

// Security HTTP Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Allow inline scripts and client assets in production
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for seamless client-server hosting
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// General Rate Limiting for API routes
app.use('/api', generalLimiter);

// API Endpoints
app.use('/api/admin', adminAuthRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    platform: 'Insta Prints API',
    status: 'Operational',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend Static Files in Production (eliminates 404 on root / single-host deployment)
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // If dist not yet built, provide helpful landing page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Insta Prints API</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 90vh; background: #0f172a; color: white;">
          <div style="text-align: center; max-width: 500px; padding: 2rem; background: #1e293b; border-radius: 1rem;">
            <h1 style="color: #818cf8; margin-bottom: 0.5rem;">Insta Prints API Server</h1>
            <p style="color: #94a3b8; font-size: 0.9rem;">The backend API is online and operational.</p>
            <p style="color: #34d399; font-size: 0.85rem; margin-top: 1rem;">Health check: <a href="/api/health" style="color: #38bdf8;">/api/health</a></p>
          </div>
        </body>
      </html>
    `);
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err.message);
  
  if (err.message && (err.message.includes('File type') || err.message.includes('Unsupported file'))) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size exceeds maximum limit of 50MB.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`  INSTA PRINTS SERVER LIVE`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Frontend Dist: ${fs.existsSync(clientDistPath) ? 'Mounted (/client/dist)' : 'API Mode'}`);
  console.log(`=========================================`);
});
