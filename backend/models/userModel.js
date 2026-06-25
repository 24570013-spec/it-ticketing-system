const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] ?? null;
}

async function createUser({ name, email, passwordHash, role }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] ?? null;
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC'
  );
  return rows;
}

async function updateRole(id, role) {
  const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  return result.affectedRows;
}

async function deleteUserData(userId) {
  // Delete in correct order to respect foreign key constraints:
  // 1. ticket_audit_log (refs tickets + users)
  // 2. ticket_attachments (refs tickets)
  // 3. notifications (refs users — has CASCADE but be explicit)
  // 4. comments (refs tickets + users)
  // 5. refresh_tokens (refs users — has CASCADE but be explicit)
  // 6. tickets (refs users)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Get ticket IDs owned by this user
    const [tickets] = await conn.query('SELECT id FROM tickets WHERE user_id = ?', [userId]);
    const ticketIds = tickets.map(t => t.id);

    if (ticketIds.length > 0) {
      const placeholders = ticketIds.map(() => '?').join(',');
      await conn.query(`DELETE FROM ticket_audit_log   WHERE ticket_id IN (${placeholders})`, ticketIds);
      await conn.query(`DELETE FROM ticket_attachments WHERE ticket_id IN (${placeholders})`, ticketIds);
      await conn.query(`DELETE FROM comments           WHERE ticket_id IN (${placeholders})`, ticketIds);
      await conn.query(`DELETE FROM tickets            WHERE user_id = ?`, [userId]);
    }

    // Clean up user-level records
    await conn.query('DELETE FROM ticket_audit_log WHERE user_id = ?', [userId]); // audit logs written by this user on other tickets
    await conn.query('DELETE FROM comments        WHERE user_id = ?', [userId]); // comments on other users' tickets
    await conn.query('DELETE FROM notifications   WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM refresh_tokens  WHERE user_id = ?', [userId]);
    // Nullify assigned tickets (tickets assigned to this user should remain, just unassigned)
    await conn.query('UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?', [userId]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteById(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { findByEmail, createUser, findById, findAll, updateRole, deleteUserData, deleteById };
