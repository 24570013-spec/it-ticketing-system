'use strict';

const categoryModel = require('../models/categoryModel');

// GET /api/categories — semua user bisa akses
async function getCategories(req, res, next) {
  try {
    const categories = await categoryModel.findAll();
    return res.status(200).json(categories);
  } catch (err) { next(err); }
}

// GET /api/categories/:id — semua user bisa akses
async function getCategoryById(req, res, next) {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    return res.status(200).json(category);
  } catch (err) { next(err); }
}

// POST /api/categories — admin only
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    const existing = await categoryModel.findByName(name.trim());
    if (existing) {
      return res.status(409).json({ message: 'Nama kategori sudah ada' });
    }

    const category = await categoryModel.create({ name: name.trim(), description });
    return res.status(201).json(category);
  } catch (err) { next(err); }
}

// PUT /api/categories/:id — admin only
async function updateCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    const existing = await categoryModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    // Cek duplikat nama (kecuali dengan diri sendiri)
    if (name && name.trim() !== existing.name) {
      const duplicate = await categoryModel.findByName(name.trim());
      if (duplicate) return res.status(409).json({ message: 'Nama kategori sudah ada' });
    }

    const updated = await categoryModel.update(req.params.id, {
      name: name?.trim(),
      description,
    });
    return res.status(200).json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/categories/:id — admin only
async function deleteCategory(req, res, next) {
  try {
    const existing = await categoryModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    await categoryModel.deleteById(req.params.id);
    return res.status(200).json({ message: 'Kategori berhasil dihapus' });
  } catch (err) { next(err); }
}

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
