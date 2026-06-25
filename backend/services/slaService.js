'use strict';

const { pool } = require('../config/db');

/**
 * Calculate SLA deadline for a ticket based on its priority.
 * @param {string} priority
 * @returns {Promise<Date|null>}
 */
async function getSlaDeadline(priority) {
  const [rows] = await pool.query('SELECT * FROM sla_rules WHERE priority = ?', [priority]);
  if (rows.length === 0) return null;
  const hours = rows[0].resolution_hours;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  return deadline;
}

/**
 * Get SLA status for a ticket.
 * @param {Object} ticket
 * @returns {{ status: 'ok'|'warning'|'breached', deadline: Date|null, hoursRemaining: number|null }}
 */
function getSlaStatus(ticket) {
  if (!ticket.sla_deadline) return { status: 'ok', deadline: null, hoursRemaining: null };
  const deadline = new Date(ticket.sla_deadline);
  const now = new Date();
  const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) return { status: 'breached', deadline, hoursRemaining: Math.round(hoursRemaining) };
  if (hoursRemaining < 2) return { status: 'warning', deadline, hoursRemaining: Math.round(hoursRemaining) };
  return { status: 'ok', deadline, hoursRemaining: Math.round(hoursRemaining) };
}

module.exports = { getSlaDeadline, getSlaStatus };
