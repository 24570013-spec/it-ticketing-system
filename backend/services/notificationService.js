'use strict';

const { pool } = require('../config/db');

async function createNotification(userId, message, type = 'info', ticketId = null) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, message, type, ticket_id) VALUES (?, ?, ?, ?)',
      [userId, message, type, ticketId]
    );
  } catch (err) {
    console.error('[notification] Failed to create notification:', err.message);
  }
}

async function getUserNotifications(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return rows;
}

async function markAsRead(notificationId, userId) {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.affectedRows;
}

async function markAllAsRead(userId) {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead };
