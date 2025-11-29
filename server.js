require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// 🔧 init app FIRST
const app = express();
app.disable('x-powered-by');
app.use(express.json());

// ✅ Robust CORS (reflect headers; safe preflight)
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://thecredibe.com',
  'https://www.thecredibe.com',
  'https://credibe-frontend.onrender.com',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');

  // reflect exactly what the browser asked to send
  const reqACRH = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Headers', reqACRH || 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.setHeader('Cache-Control', 'no-store');
    return res.sendStatus(204);
  }
  next();
});

// 🔌 DB
const connectDB = require('./config/db');

// 🛣️ Routes (require AFTER app exists)
const authRoutes = require('./routes/auth');
const transferRoutes = require('./routes/transfer');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const topUpRoutes = require('./routes/topup');
const settingsRoutes = require('./routes/settings');

// 🚀 Start
const startServer = async () => {
  try {
    await connectDB();

    // mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/transfer', transferRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/topup', topUpRoutes);
    app.use('/api/settings', settingsRoutes);

    // basic health route (useful for Render/CF checks)
    app.get('/health', (_req, res) => res.json({ ok: true }));

    // 404 fallback
    app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

    // error handler
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Server error' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Server startup error:', err.message);
    process.exit(1);
  }
};

startServer();
