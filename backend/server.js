const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// 1. Read configuration from backend/.env
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 2. Connect to Database
connectDB();

const app = express();

// 3. Configure CORS safely for local development
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const customOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...customOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' not allowed by Access-Control-Allow-Origin.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health Check Endpoint: GET /api/health
// Reports backend and database connection status without exposing secrets
app.get('/api/health', (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = readyStates[dbReadyState] || 'unknown';
  const isDbConnected = dbReadyState === 1;

  // Determine DB deployment type without exposing connection string, passwords, or host IPs
  let dbType = 'Not Connected';
  if (isDbConnected) {
    const host = mongoose.connection.host || '';
    if (host.includes('mongodb.net') || host.includes('cluster')) {
      dbType = 'MongoDB Atlas (Cloud)';
    } else if (host.includes('127.0.0.1') || host.includes('localhost')) {
      dbType = 'Local / Embedded MongoDB Engine';
    } else {
      dbType = 'Self-Hosted MongoDB';
    }
  }

  const responsePayload = {
    success: true,
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'Cloud-Based Smart Parking Management System API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    backend: {
      status: 'online',
      nodeVersion: process.version,
      port: Number(PORT),
    },
    database: {
      status: dbStatus,
      connected: isDbConnected,
      type: dbType,
      name: isDbConnected ? mongoose.connection.name : null,
    },
    features: {
      singleOriginStaticServing: fs.existsSync(path.join(__dirname, '../frontend/dist')),
      viteDevSupport: true,
    },
  };

  res.status(isDbConnected ? 200 : 503).json(responsePayload);
});

// 5. Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// 6. Serve Built React Frontend for Single-Origin Production-style Local Run
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const hasBuiltFrontend = fs.existsSync(frontendDistPath);

if (hasBuiltFrontend) {
  // Serve static assets from frontend/dist
  app.use(express.static(frontendDistPath));

  // Catch-all route to support client-side routing in single-origin mode
  app.get('*', (req, res, next) => {
    // Skip API routes so they 404 properly if unhandled
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  // In development before build, provide clean API landing
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: 'Cloud-Based Smart Parking Management System API Server',
      documentation: 'Run the Vite frontend in dev mode on http://localhost:5173, or run "npm run build" to serve from this port.',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        slots: '/api/slots',
        bookings: '/api/bookings',
      },
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });
}

// 7. API 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    hint: 'Check /api/health for system status or verify the route spelling.',
  });
});

// 8. Central Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.message);
  if (NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for parameter: ${err.path}`,
    });
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `Duplicate value entered for ${duplicateField}. Must be unique.`,
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Please login again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session token has expired. Please login again.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { errorName: err.name }),
  });
});

// 9. Startup Messages
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  🚗 Smart Parking Management System Server Running`);
  console.log(`=================================================`);
  console.log(`  • Local API Server:      http://localhost:${PORT}`);
  console.log(`  • Health Check API:      http://localhost:${PORT}/api/health`);
  console.log(`  • Environment Mode:      ${NODE_ENV}`);
  console.log(`  • Frontend Serving Mode: ${hasBuiltFrontend ? `Single-Origin Bundle (http://localhost:${PORT})` : 'Vite Dev Proxy (http://localhost:5173)'}`);
  console.log(`  • Allowed CORS Origins:  ${allowedOrigins.join(', ')}`);
  console.log(`=================================================`);
});
