'use strict';

const { pool } = require('../config/db');

/**
 * Log a status change to ticket_status_log.
 * Automatically calculates duration spent in previous status.
 */
async function logStatusChange(ticketId, userId, fromStatus, toStatus, note = null) {
  try {
    // Calculate duration in previous status (minutes)
    let durationMinutes = null;
    if (fromStatus) {
      const [prev] = await pool.query(
        `SELECT created_at FROM ticket_status_log
         WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1`,
        [ticketId]
      );
      if (prev.length > 0) {
        const diffMs = new Date() - new Date(prev[0].created_at);
        durationMinutes = Math.round(diffMs / 60000);
      }
    }

    await pool.query(
      `INSERT INTO ticket_status_log (ticket_id, user_id, from_status, to_status, note, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, userId, fromStatus || null, toStatus, note, durationMinutes]
    );
  } catch (err) {
    console.error('[statusLog] Failed to log status change:', err.message);
  }
}

/**
 * Get full status timeline for a ticket.
 */
async function getStatusTimeline(ticketId) {
  const [rows] = await pool.query(
    `SELECT sl.*, u.name AS user_name, u.role AS user_role
     FROM ticket_status_log sl
     JOIN users u ON sl.user_id = u.id
     WHERE sl.ticket_id = ?
     ORDER BY sl.created_at ASC`,
    [ticketId]
  );
  return rows;
}

module.exports = { logStatusChange, getStatusTimeline };
