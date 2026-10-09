// ================================================================
// FlashTiket Backend — Main Server Entry Point
// ================================================================
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import redis from './config/redis.js';

// Route imports
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import ticketRoutes from './routes/tickets.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/reviews.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ================================================================
// Middleware Stack
// ================================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow frontend dev servers and production domains (Render/Vercel)
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      devOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    // Allow for public demo
    return callback(null, true);
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ================================================================
// API Routes
// ================================================================
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ── Health Check ───────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: '⚡ FlashTiket Backend is alive!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan.' });
});

// ── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan internal server.'
      : err.message,
  });
});

// ================================================================
// Server Startup
// ================================================================
async function startServer() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     ⚡ FlashTiket Backend Server             ║');
  console.log('║     War Tiket Engine v1.0.0                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Connect to Redis
  try {
    await redis.connect();
    console.log('  ✅ Redis connected');
  } catch (err) {
    console.warn('  ⚠️  Redis connection failed:', err.message);
    console.warn('     Server will start without Redis (limited functionality)');
  }

  // Initialize visitor counter if not exists
  try {
    const exists = await redis.exists('stats:active_visitors');
    if (!exists) {
      await redis.set('stats:active_visitors', 0);
    }
  } catch (err) {
    console.warn('  ⚠️  Redis visitor counter init skipped (Redis offline)');
  }

  // Start HTTP server
  app.listen(PORT, () => {
    console.log('');
    console.log(`  🚀 Server running on http://localhost:${PORT}`);
    console.log(`  📡 API Base:  http://localhost:${PORT}/api`);
    console.log(`  🏥 Health:    http://localhost:${PORT}/api/admin/health`);
    console.log(`  📋 Ping:      http://localhost:${PORT}/api/ping`);
    console.log('');
    console.log('  Available API Routes:');
    console.log('  ├── POST   /api/auth/register');
    console.log('  ├── POST   /api/auth/login');
    console.log('  ├── GET    /api/auth/me');
    console.log('  ├── GET    /api/events');
    console.log('  ├── GET    /api/events/:id');
    console.log('  ├── POST   /api/tickets/join-queue');
    console.log('  ├── GET    /api/tickets/queue-status/:eventId');
    console.log('  ├── POST   /api/tickets/reserve');
    console.log('  ├── POST   /api/tickets/confirm');
    console.log('  ├── GET    /api/tickets/my-tickets');
    console.log('  ├── GET    /api/wishlist');
    console.log('  ├── POST   /api/wishlist/:eventId');
    console.log('  ├── DELETE /api/wishlist/:eventId');
    console.log('  ├── DELETE /api/wishlist');
    console.log('  ├── GET    /api/reviews/:eventId');
    console.log('  ├── POST   /api/reviews/:eventId');
    console.log('  ├── GET    /api/payments/client-key');
    console.log('  ├── POST   /api/payments/create-snap-token');
    console.log('  ├── POST   /api/payments/notification');
    console.log('  ├── GET    /api/payments/status/:orderId');
    console.log('  ├── GET    /api/admin/stats');
    console.log('  ├── GET    /api/admin/health');
    console.log('  └── POST   /api/admin/simulate-traffic');
    console.log('');
    console.log('  ────────────────────────────────────────────');
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
}

// In Vercel serverless environment, Vercel wraps the exported app directly
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
