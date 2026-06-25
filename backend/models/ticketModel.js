'use strict';

const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT t.*, u.name AS assigned_to_name, c.name AS category_name
  FROM tickets t
  LEFT JOIN users u ON t.assigned_to = u.id
  LEFT JOIN categories c ON t.category_id = c.id
`;

/**
 * Build WHERE clause from filters.
 * @param {{ search?, status?, priority? }} filters
 * @param {Array} params - accumulator for query params
 * @returns {string} WHERE clause string
 */
function buildWhere(filters = {}, params = []) {
  const conditions = [];
  if (filters.search) {
    conditions.push('(t.title LIKE ? OR t.nama_store LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.status) {
    conditions.push('t.status = ?');
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push('t.priority = ?');
    params.push(filters.priority);
  }
  if (filters.from) {
    conditions.push('DATE(t.created_at) >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('DATE(t.created_at) <= ?');
    params.push(filters.to);
  }
  return conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
}

async function create({ title, nama_store, description, priority = 'medium', userId, categoryId }) {
  const now = new Date();
  const [result] = await pool.query(
    'INSERT INTO tickets (title, nama_store, description, priority, category_id, user_id, tanggal_open) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, nama_store ?? null, description, priority, categoryId ?? null, userId, now]
  );
  return findById(result.insertId);
}

/**
 * @param {{ search?, status?, priority? }} filters
 * @param {{ page?, limit? }} pagination
 * @returns {Promise<{ rows: Object[], total: number }>}
 */
async function findAll(filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  const params = [];
  const where = buildWhere(filters, params);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t ${where}`,
    params
  );

  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return { rows, total };
}

async function findById(id) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE t.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * @param {number} userId
 * @param {{ search?, status?, priority? }} filters
 * @param {{ page?, limit? }} pagination
 * @returns {Promise<{ rows: Object[], total: number }>}
 */
async function findByUserId(userId, filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Show tickets the user created OR tickets assigned to them
  const baseCondition = '(t.user_id = ? OR t.assigned_to = ?)';
  const params = [userId, userId];
  const extraConditions = [];

  if (filters.search) {
    extraConditions.push('(t.title LIKE ? OR t.nama_store LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.status) {
    // Explicit status filter: show exactly that status
    extraConditions.push('t.status = ?');
    params.push(filters.status);
  }
  // No default hiding of closed — user should see all their tickets including closed ones

  if (filters.priority) {
    extraConditions.push('t.priority = ?');
    params.push(filters.priority);
  }
  if (filters.from) {
    extraConditions.push('DATE(t.created_at) >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    extraConditions.push('DATE(t.created_at) <= ?');
    params.push(filters.to);
  }

  const extraWhere = extraConditions.length > 0 ? 'AND ' + extraConditions.join(' AND ') : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t WHERE ${baseCondition} ${extraWhere}`,
    params
  );

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ${baseCondition} ${extraWhere} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return { rows, total };
}

/**
 * Find tickets assigned to a specific engineer.
 * @param {number} engineerId
 * @param {{ search?, status?, priority? }} filters
 * @param {{ page?, limit? }} pagination
 */
async function findByAssignedTo(engineerId, filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  const params = [engineerId];
  const extraConditions = [];

  if (filters.search) {
    extraConditions.push('(t.title LIKE ? OR t.nama_store LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.status) {
    extraConditions.push('t.status = ?');
    params.push(filters.status);
  }
  if (filters.priority) {
    extraConditions.push('t.priority = ?');
    params.push(filters.priority);
  }
  if (filters.from) {
    extraConditions.push('DATE(t.created_at) >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    extraConditions.push('DATE(t.created_at) <= ?');
    params.push(filters.to);
  }

  const extraWhere = extraConditions.length > 0 ? 'AND ' + extraConditions.join(' AND ') : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t WHERE t.assigned_to = ? ${extraWhere}`,
    params
  );

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE t.assigned_to = ? ${extraWhere} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return { rows, total };
}

async function updateStatus(id, status) {
  const [result] = await pool.query('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows;
}

async function update(id, fields) {
  const columnMap = {
    title:      'title',
    nama_store: 'nama_store',
    description:'description',
    priority:   'priority',
    status:     'status',
    assignedTo: 'assigned_to',
    categoryId: 'category_id',
  };

  const setClauses = [];
  const values = [];

  for (const [key, col] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      values.push(fields[key]);
    }
  }

  // Auto-set tanggal tracking berdasarkan perubahan status
  if (fields.status === 'in_progress') {
    setClauses.push('tanggal_progress = COALESCE(tanggal_progress, NOW())');
  }
  if (fields.status === 'resolved' || fields.status === 'closed') {
    setClauses.push('tanggal_progress = COALESCE(tanggal_progress, NOW())');
    setClauses.push('tanggal_resolved = COALESCE(tanggal_resolved, NOW())');
  }

  if (setClauses.length === 0) return 0;

  values.push(id);
  const [result] = await pool.query(
    `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows;
}

async function deleteById(id) {
  const [result] = await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { create, findAll, findById, findByUserId, findByAssignedTo, updateStatus, update, deleteById };
