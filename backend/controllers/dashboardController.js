'use strict';

const { pool } = require('../config/db');

/**
 * GET /api/dashboard/stats — admin only
 * Returns comprehensive dashboard data.
 */
async function getStats(req, res, next) {
  try {
    // ── Stat cards ──────────────────────────────────────────────────────────
    const [[counts]] = await pool.query(`
      SELECT
        COUNT(*)                                                   AS total,
        SUM(status = 'open')                                       AS open_count,
        SUM(status IN ('in_progress','waiting','checking'))        AS in_progress_count,
        SUM(status = 'resolved')                                   AS resolved_count,
        SUM(status = 'closed')                                     AS closed_count,
        SUM(status = 'pending')                                    AS pending_count
      FROM tickets
    `);

    const [[avgRes]] = await pool.query(`
      SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) AS avg_resolution_hours
      FROM tickets
      WHERE status IN ('resolved', 'closed')
    `);

    // SLA stats — breached = deadline passed AND ticket not yet resolved/closed
    const [[slaStats]] = await pool.query(`
      SELECT
        SUM(CASE
              WHEN sla_deadline IS NULL THEN 1
              WHEN sla_deadline >= NOW() THEN 1
              ELSE 0
            END) AS within_sla,
        SUM(CASE
              WHEN sla_deadline IS NOT NULL
               AND sla_deadline < NOW()
               AND status NOT IN ('resolved','closed') THEN 1
              ELSE 0
            END) AS breached_sla
      FROM tickets
    `);

    // ── Top 10 Users by ticket count ─────────────────────────────────────────
    const [topUsers] = await pool.query(`
      SELECT u.name, u.email, COUNT(t.id) AS total
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      GROUP BY t.user_id, u.name, u.email
      ORDER BY total DESC
      LIMIT 10
    `);

    // ── Top 10 Issues (most common ticket titles) ────────────────────────────
    const [topIssues] = await pool.query(`
      SELECT title, COUNT(*) AS total
      FROM tickets
      GROUP BY title
      ORDER BY total DESC
      LIMIT 10
    `);

    // ── Daily chart — last 30 days ───────────────────────────────────────────
    const [dailyChart] = await pool.query(`
      SELECT
        DATE(created_at) AS date,
        COUNT(*)         AS total,
        SUM(CASE
              WHEN sla_deadline IS NOT NULL
               AND sla_deadline < NOW()
               AND status NOT IN ('resolved','closed') THEN 1
              ELSE 0
            END) AS exceeded_sla
      FROM tickets
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // ── Monthly chart — last 12 months ───────────────────────────────────────
    const [monthlyChart] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        DATE_FORMAT(created_at, '%M %Y') AS label,
        COUNT(*) AS total
      FROM tickets
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%M %Y')
      ORDER BY month ASC
    `);

    // ── Priority distribution ─────────────────────────────────────────────────
    const [topPriorityArea] = await pool.query(`
      SELECT priority AS area, COUNT(*) AS total
      FROM tickets
      GROUP BY priority
      ORDER BY FIELD(priority, 'high', 'medium', 'low')
    `);

    return res.status(200).json({
      total:                Number(counts.total          ?? 0),
      open:                 Number(counts.open_count     ?? 0),
      in_progress:          Number(counts.in_progress_count ?? 0),
      resolved:             Number(counts.resolved_count ?? 0),
      closed:               Number(counts.closed_count   ?? 0),
      pending:              Number(counts.pending_count  ?? 0),
      avg_resolution_hours: avgRes.avg_resolution_hours  ?? 0,
      within_sla:           Number(slaStats.within_sla   ?? 0),
      sla_breached:         Number(slaStats.breached_sla ?? 0),

      top_users:         topUsers,
      top_issues:        topIssues,
      daily_chart:       dailyChart,
      monthly_chart:     monthlyChart,
      top_priority_area: topPriorityArea,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
