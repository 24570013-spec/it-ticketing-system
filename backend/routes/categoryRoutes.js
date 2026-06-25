'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getCategories, getCategoryById,
  createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');

const router = Router();
const adminOnly = [authenticate, requireRole('admin')];

// Public (authenticated) — user bisa lihat daftar kategori saat buat tiket
router.get('/',    authenticate, getCategories);
router.get('/:id', authenticate, getCategoryById);

// Admin only — CRUD
router.post('/',    ...adminOnly, createCategory);
router.put('/:id',  ...adminOnly, updateCategory);
router.delete('/:id', ...adminOnly, deleteCategory);

module.exports = router;
