'use strict';

const { pool } = require('../config/db');

/**
 * Log a ticket change to the audit log.
 * @param {number} ticketId
 * @param {number} userId
 * @param {string} action  e.g. 'created', 'status_changed', 'assigned', 'updated', 'deleted'
 * @param {string|null} field
 * @param {string|null} oldValue
 * @param {string|null} newValue
 */
async function logTicketAction(ticketId, userId, action, field = null, oldValue = null, newValue = null) {
  try {
    await pool.query(
      'INSERT INTO ticket_audit_log (ticket_id, user_id, action, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, userId, action, field, oldValue ? String(oldValue) : null, newValue ? String(newValue) : null]
    );
  } catch (err) {
    console.error('[audit] Failed to log action:', err.message);
  }
}

/**
 * Get audit log for a ticket.
 * @param {number} ticketId
 * @returns {Promise<Object[]>}
 */
async function getTicketAuditLog(ticketId) {
  const [rows] = await pool.query(
    `SELECT a.*, u.name AS user_name
     FROM ticket_audit_log a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.ticket_id = ?
     ORDER BY a.created_at ASC`,
    [ticketId]
  );
  return rows;
}

module.exports = { logTicketAction, getTicketAuditLog };
