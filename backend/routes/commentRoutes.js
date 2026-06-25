'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

// mergeParams: true so /:ticketId from parent router is accessible
const router = Router({ mergeParams: true });

// Nested under /api/tickets/:ticketId/comments
router.post('/', authenticate, addComment);
router.get('/',  authenticate, getComments);

// Delete — authenticated user (controller checks ownership/admin)
router.delete('/:id', authenticate, deleteComment);

module.exports = router;
