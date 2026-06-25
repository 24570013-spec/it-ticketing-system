'use strict';

const commentModel = require('../models/commentModel');
const ticketModel = require('../models/ticketModel');

async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    const ticketId = req.params.ticketId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Permission: admin full access, engineer on assigned tickets, user on own tickets
    if (req.user.role === 'engineer') {
      if (Number(ticket.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Forbidden: kamu hanya bisa komentar pada tiket yang di-assign ke kamu.' });
      }
    } else if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Prevent comment on closed tickets (except admin)
    if (req.user.role !== 'admin' && ticket.status === 'closed') {
      return res.status(400).json({ message: 'Tidak bisa menambahkan komentar pada tiket yang sudah closed.' });
    }

    const comment = await commentModel.create({
      ticketId,
      userId: req.user.id,
      content: content.trim(),
    });

    return res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const ticketId = req.params.ticketId;

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Admin: full access
    // Engineer: can read comments on assigned tickets
    // User (staff): can only read comments on their own tickets
    if (req.user.role === 'engineer') {
      if (Number(ticket.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const comments = await commentModel.findByTicketId(ticketId);
    return res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    // Admin can delete any comment; others can only delete their own
    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await commentModel.deleteById(req.params.id);
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { addComment, getComments, deleteComment };
