'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getAuditLog, getTimeline,
} = require('../controllers/ticketController');
const {
  uploadAttachment, getAttachments, deleteAttachment,
} = require('../controllers/attachmentController');
const commentRoutes = require('./commentRoutes');

const router = Router();

router.post('/',   authenticate, requireRole('admin', 'user'), createTicket);
router.get('/',    authenticate, getTickets);
router.get('/:id', authenticate, getTicketById);
router.put('/:id', authenticate, updateTicket);
router.delete('/:id', authenticate, requireRole('admin'), deleteTicket);

// Audit log
router.get('/:id/audit',    authenticate, getAuditLog);
// Status timeline
router.get('/:id/timeline', authenticate, getTimeline);

// Attachments
router.post('/:id/attachments',                 authenticate, upload.single('file'), uploadAttachment);
router.get('/:id/attachments',                  authenticate, getAttachments);
router.delete('/:id/attachments/:attachId',     authenticate, deleteAttachment);

// Nested comments
router.use('/:ticketId/comments', commentRoutes);

module.exports = router;
