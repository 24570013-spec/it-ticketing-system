'use strict';

// Task 5.1 — Environment loading must be the very first statement
require('dotenv').config();

const { validateEnv } = require('./config/validateEnv');
validateEnv();

const { connectDB } = require('./config/db');

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const authRoutes         = require('./routes/authRoutes');
const ticketRoutes       = require('./routes/ticketRoutes');
const userRoutes         = require('./routes/userRoutes');
const commentRoutes      = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const categoryRoutes     = require('./routes/categoryRoutes');

// ─── App setup ───────────────────────────────────────────────────────────────

const app = express();

// CORS — support multiple origins (comma-separated in CORS_ORIGIN env var)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Task 5.3 — Health check and route mounting
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth',          authRoutes);
app.use('/api/tickets',       ticketRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/comments',      commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/categories',    categoryRoutes);

// Serve uploaded files statically
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

// Task 5.4 — 404 catch-all (must come after all routes)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Task 5.4 — Centralized error handler (4-argument signature required by Express)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const body = { message: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }
  console.error(err);
  res.status(status).json(body);
});

// ─── Server startup ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

// Task 5.5 — Unhandled rejection guard (register before async work)
process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});

// Task 5.1 — Connect to DB then start listening (only when run directly, not when required by tests)
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Export app for testing (supertest needs the express app, not the http.Server)
module.exports = app;
