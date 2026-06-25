'use strict';

// DB_PASSWORD is intentionally excluded — it may be empty (e.g. XAMPP default)
const REQUIRED_VARS = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(
      `[validateEnv] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'Please define them in your .env file before starting the server.'
    );
    process.exit(1);
  }

  // Warn about insecure defaults in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'changeme_supersecret_jwt_key') {
      console.warn('[validateEnv] WARNING: JWT_SECRET is using the default insecure value. Change it in production!');
    }
    if (process.env.REFRESH_TOKEN_SECRET === 'changeme_refresh_token_secret') {
      console.warn('[validateEnv] WARNING: REFRESH_TOKEN_SECRET is using the default insecure value. Change it in production!');
    }
  }
}

module.exports = { validateEnv };
