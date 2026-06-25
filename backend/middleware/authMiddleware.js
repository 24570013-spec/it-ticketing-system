'use strict';

const jwt = require('jsonwebtoken');

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * On success: attaches decoded payload to req.user and calls next().
 * On failure: returns 401.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
