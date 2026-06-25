'use strict';

const { pool } = require('../config/db');

async function create({ ticketId, userId, content }) {
  const [result] = await pool.query(
    'INSERT INTO comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
    [ticketId, userId, content]
  );
  return findById(result.insertId);
}

async function findByTicketId(ticketId) {
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name, u.role AS user_role
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.ticket_id = ?
     ORDER BY c.created_at ASC`,
    [ticketId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name, u.role AS user_role
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

async function deleteById(id) {
  const [result] = await pool.query('DELETE FROM comments WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { create, findByTicketId, findById, deleteById };
