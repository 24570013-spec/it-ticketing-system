'use strict';

const path = require('path');
const fs   = require('fs');
const { pool } = require('../config/db');

async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const { id: ticketId } = req.params;

    const [result] = await pool.query(
      'INSERT INTO ticket_attachments (ticket_id, user_id, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, req.user.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size]
    );

    return res.status(201).json({
      id: result.insertId,
      ticket_id: ticketId,
      filename: req.file.originalname,
      filepath: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) { next(err); }
}

async function getAttachments(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    return res.status(200).json(rows);
  } catch (err) { next(err); }
}

async function deleteAttachment(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM ticket_attachments WHERE id = ?', [req.params.attachId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Attachment not found' });

    const att = rows[0];
    // Only owner or admin can delete
    if (req.user.role !== 'admin' && att.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', att.filepath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM ticket_attachments WHERE id = ?', [req.params.attachId]);
    return res.status(200).json({ message: 'Attachment deleted' });
  } catch (err) { next(err); }
}

module.exports = { uploadAttachment, getAttachments, deleteAttachment };
