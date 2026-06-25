'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST,
  port:              Number(process.env.DB_PORT) || 3306,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  // Production-friendly: handle dropped connections
  enableKeepAlive:   true,
  keepAliveInitialDelay: 0,
  // Timezone consistency
  timezone:          '+00:00',
});

/**
 * Verifies database connectivity by running a lightweight test query.
 * Logs success or exits the process on failure.
 */
async function connectDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log(`[db] Connected to MySQL — ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };
