'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getUsers, getUserById, updateUserRole, deleteUser } = require('../controllers/userController');

const router = Router();
const adminOnly = [authenticate, requireRole('admin')];

router.get('/',         ...adminOnly, getUsers);
router.get('/:id',      ...adminOnly, getUserById);
router.put('/:id/role', ...adminOnly, updateUserRole);
router.delete('/:id',   ...adminOnly, deleteUser);

module.exports = router;
