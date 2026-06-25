'use strict';

const { Router } = require('express');
const rateLimit  = require('express-rate-limit');
const { register, login, refresh, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

// Max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Register is admin-only — public self-registration is disabled
router.post('/register', authenticate, requireRole('admin'), register);
router.post('/login',    loginLimiter, login);
router.post('/refresh',  refresh);
router.post('/logout',   logout);

module.exports = router;
