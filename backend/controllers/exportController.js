'use strict';

const { pool } = require('../config/db');

/**
 * GET /api/export/tickets — admin only
 * Export tickets to CSV with optional date range filter
 */
async function exportTicketsCSV(req, res, next) {
  try {
    const { from, to, status, priority } = req.query;

    const conditions = [];
    const params = [];

    if (from) {
      conditions.push('DATE(t.created_at) >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('DATE(t.created_at) <= ?');
      params.push(to);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [tickets] = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.nama_store,
        c.name AS category,
        t.priority,
        t.status,
        u_owner.name  AS pembuat,
        u_owner.email AS email_pembuat,
        u_eng.name    AS engineer,
        t.created_at  AS tanggal_buat,
        t.tanggal_open,
        t.tanggal_progress,
        t.tanggal_resolved,
        t.sla_deadline,
        CASE
          WHEN t.sla_deadline IS NULL THEN 'Tidak ada SLA'
          WHEN t.sla_deadline < NOW() AND t.status NOT IN ('resolved','closed') THEN 'Breach'
          ELSE 'OK'
        END AS sla_status,
        t.description
      FROM tickets t
      LEFT JOIN users u_owner ON t.user_id    = u_owner.id
      LEFT JOIN users u_eng   ON t.assigned_to = u_eng.id
      LEFT JOIN categories c  ON t.category_id = c.id
      ${where}
      ORDER BY t.created_at DESC
    `, params);

    // Build CSV
    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).replace(',', '');
    };

    const headers = [
      'No Tiket', 'Judul', 'Nama Store', 'Kategori', 'Prioritas', 'Status',
      'Pembuat', 'Email Pembuat', 'Engineer', 'Tanggal Buat',
      'Tanggal Open', 'Tanggal Progress', 'Tanggal Resolved',
      'SLA Deadline', 'SLA Status', 'Deskripsi',
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };

    const rows = tickets.map(t => [
      t.id, t.title, t.nama_store, t.category, t.priority, t.status,
      t.pembuat, t.email_pembuat, t.engineer,
      fmtDate(t.tanggal_buat), fmtDate(t.tanggal_open),
      fmtDate(t.tanggal_progress), fmtDate(t.tanggal_resolved),
      fmtDate(t.sla_deadline), t.sla_status, t.description,
    ].map(escapeCSV).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const filename = `tickets_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM for Excel UTF-8
    return res.status(200).send('\uFEFF' + csv);
  } catch (err) { next(err); }
}

module.exports = { exportTicketsCSV };
