'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { findByEmail, createUser } = require('../models/userModel');
const { pool } = require('../config/db');

// ── Validation chains ──────────────────────────────────────────────────────
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Token helpers ──────────────────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return token;
}

// ── Handlers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = [
  ...registerValidation,
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password, role } = req.body;

      // Validate role — admin can create any role, defaults to 'user'
      const VALID_ROLES = ['user', 'admin', 'engineer'];
      const assignedRole = role && VALID_ROLES.includes(role) ? role : 'user';

      const existing = await findByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const insertId     = await createUser({ name, email, passwordHash, role: assignedRole });

      const payload      = { id: insertId, email, role: assignedRole };
      const accessToken  = signAccessToken(payload);
      const refreshToken = await createRefreshToken(insertId);

      return res.status(201).json({
        token:        accessToken,
        refreshToken,
        user: { id: insertId, name, email, role: assignedRole },
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * POST /api/auth/login
 */
const login = [
  ...loginValidation,
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const payload      = { id: user.id, email: user.email, role: user.role };
      const accessToken  = signAccessToken(payload);
      const refreshToken = await createRefreshToken(user.id);

      return res.status(200).json({
        token:        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const storedToken = rows[0];
    const [users]     = await pool.query('SELECT * FROM users WHERE id = ?', [storedToken.user_id]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user        = users[0];
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({ token: accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Revoke the refresh token.
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
