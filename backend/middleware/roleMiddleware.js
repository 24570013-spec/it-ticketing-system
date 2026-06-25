'use strict';

/**
 * Factory that returns middleware enforcing role membership.
 * Must be applied after authenticate() so req.user is populated.
 *
 * @param {...string} roles  Allowed role values (e.g. 'admin', 'user')
 * @returns {Function} Express middleware
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  };
}

module.exports = { requireRole };
