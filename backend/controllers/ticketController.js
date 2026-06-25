'use strict';

const ticketModel = require('../models/ticketModel');
const userModel   = require('../models/userModel');
const { sendStatusChangeEmail } = require('../services/emailService');
const { logTicketAction, getTicketAuditLog } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { getSlaDeadline, getSlaStatus } = require('../services/slaService');
const { logStatusChange, getStatusTimeline } = require('../services/statusLogService');
const { pool } = require('../config/db');

const VALID_STATUSES   = ['open', 'waiting', 'in_progress', 'checking', 'pending', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Status yang boleh di-set oleh engineer
const ENGINEER_ALLOWED_STATUSES = ['waiting', 'in_progress', 'checking', 'pending', 'resolved'];

async function createTicket(req, res, next) {
  try {
    const { title, description, priority, category_id, nama_store } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const ticket = await ticketModel.create({
      title, nama_store, description, priority,
      categoryId: category_id ?? null,
      userId: req.user.id,
    });

    // Set SLA deadline and log creation
    const deadline = await getSlaDeadline(ticket.priority);
    if (deadline) {
      await pool.query('UPDATE tickets SET sla_deadline = ? WHERE id = ?', [deadline, ticket.id]);
    }
    await logTicketAction(ticket.id, req.user.id, 'created');
    // Log initial status to timeline
    await logStatusChange(ticket.id, req.user.id, null, 'open', 'Tiket dibuat');

    const fresh = await ticketModel.findById(ticket.id);
    return res.status(201).json(fresh);
  } catch (err) { next(err); }
}

async function getTickets(req, res, next) {
  try {
    const { search, status, priority, from, to, page: rawPage, limit: rawLimit } = req.query;

    // Validate enums if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: `Invalid priority value. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    // Parse and validate pagination
    const page  = rawPage  ? parseInt(rawPage,  10) : 1;
    const limit = rawLimit ? parseInt(rawLimit, 10) : 10;

    if (isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'page must be a positive integer' });
    }
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'limit must be a positive integer' });
    }

    const filters    = { search, status, priority, from, to };
    const pagination = { page, limit };

    let result;
    if (req.user.role === 'admin') {
      result = await ticketModel.findAll(filters, pagination);
    } else if (req.user.role === 'engineer') {
      // Engineer only sees tickets assigned to them
      result = await ticketModel.findByAssignedTo(req.user.id, filters, pagination);
    } else {
      result = await ticketModel.findByUserId(req.user.id, filters, pagination);
    }

    const { rows, total } = result;

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({ data: rows, total, page, limit, totalPages });
  } catch (err) { next(err); }
}

async function getTicketById(req, res, next) {
  try {
    const ticket = await ticketModel.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Engineer can view tickets assigned to them, user (staff) can only view their own tickets
    if (req.user.role !== 'admin' && req.user.role !== 'engineer' && Number(ticket.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Engineer can only access tickets assigned to them
    if (req.user.role === 'engineer' && Number(ticket.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: tiket ini tidak di-assign ke kamu.' });
    }

    const sla = getSlaStatus(ticket);
    return res.status(200).json({ ...ticket, sla });
  } catch (err) { next(err); }
}

async function updateTicket(req, res, next) {
  try {
    const { title, description, priority, status, assigned_to, category_id, nama_store } = req.body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }

    const ticket = await ticketModel.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Permission: admin full access, engineer can only update assigned tickets, user can only update own tickets
    if (req.user.role === 'engineer') {
      if (Number(ticket.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Forbidden: tiket ini tidak di-assign ke kamu.' });
      }
      // Engineer can only update status (within allowed statuses) and add notes via comments
      if (status !== undefined && !ENGINEER_ALLOWED_STATUSES.includes(status)) {
        return res.status(403).json({ message: `Engineer hanya bisa mengubah status ke: ${ENGINEER_ALLOWED_STATUSES.join(', ')}` });
      }
    } else if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Users (staff) cannot jump to other statuses — only resolved or closed (to confirm completion)
    if (req.user.role === 'user' && status !== undefined && !['resolved', 'closed'].includes(status)) {
      return res.status(403).json({ message: 'User hanya dapat menandai tiket sebagai resolved atau closed.' });
    }
    // Users can only close a ticket that is already resolved (confirmed by admin flow or engineer)
    if (req.user.role === 'user' && status === 'closed' && ticket.status !== 'resolved') {
      return res.status(400).json({ message: 'Tiket hanya bisa ditutup setelah statusnya resolved.' });
    }

    // Validate assigned_to user exists (admin only)
    if (req.user.role === 'admin' && assigned_to !== undefined && assigned_to !== null) {
      const assignee = await userModel.findById(assigned_to);
      if (!assignee) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }
      // Warn if trying to assign to a plain user (should assign to engineer or admin)
      if (assignee.role === 'user') {
        console.warn(`[assign] Ticket ${req.params.id} assigned to user (role=user) id=${assigned_to}`);
      }
    }

    const prevStatus = ticket.status;

    // Build field update set based on role
    let fields;
    if (req.user.role === 'admin') {
      fields = { title, nama_store, description, priority, status, assignedTo: assigned_to, categoryId: category_id };
    } else if (req.user.role === 'engineer') {
      // Engineer can only update status
      fields = { status };
    } else {
      // User (staff) can mark resolved OR close (if already resolved)
      fields = { status: ['resolved', 'closed'].includes(status) ? status : undefined };
    }

    Object.keys(fields).forEach(k => fields[k] === undefined && delete fields[k]);

    await ticketModel.update(req.params.id, fields);
    const updated = await ticketModel.findById(req.params.id);
    if (status !== undefined && status !== prevStatus) {
      await logTicketAction(ticket.id, req.user.id, 'status_changed', 'status', prevStatus, status);
      // Log ke status timeline dengan timestamp detail
      await logStatusChange(ticket.id, req.user.id, prevStatus, status);
      // Notify ticket owner
      await createNotification(ticket.user_id, `Tiket "${ticket.title}" diupdate menjadi: ${status}`, 'status_change', ticket.id);
      // If engineer resolved, notify admin too
      if (status === 'resolved' && req.user.role === 'engineer') {
        const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of admins) {
          await createNotification(admin.id, `Engineer menyelesaikan tiket "${ticket.title}" — menunggu konfirmasi.`, 'status_change', ticket.id);
        }
      }
      try {
        const owner = await userModel.findById(ticket.user_id);
        if (owner?.email) await sendStatusChangeEmail(owner.email, ticket.title, status);
      } catch (emailErr) {
        console.error('[email] Failed to send status change email:', emailErr.message);
      }
    }

    // Log assignment change
    if (req.user.role === 'admin' && assigned_to !== undefined) {
      await logTicketAction(ticket.id, req.user.id, 'assigned', 'assigned_to', ticket.assigned_to, assigned_to);
    }

    return res.status(200).json(updated);
  } catch (err) { next(err); }
}

async function deleteTicket(req, res, next) {
  try {
    const ticket = await ticketModel.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    await logTicketAction(ticket.id, req.user.id, 'deleted');
    await ticketModel.deleteById(req.params.id);
    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) { next(err); }
}

async function getAuditLog(req, res, next) {
  try {
    const ticket = await ticketModel.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const log = await getTicketAuditLog(req.params.id);
    return res.status(200).json(log);
  } catch (err) { next(err); }
}

async function getTimeline(req, res, next) {
  try {
    const ticket = await ticketModel.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    // All parties involved can view the timeline
    if (req.user.role === 'engineer' && Number(ticket.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'engineer' && Number(ticket.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const timeline = await getStatusTimeline(req.params.id);
    return res.status(200).json(timeline);
  } catch (err) { next(err); }
}

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getAuditLog, getTimeline };
