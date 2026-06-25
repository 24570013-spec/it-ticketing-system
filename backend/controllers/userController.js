'use strict';

const userModel = require('../models/userModel');

const VALID_ROLES = ['user', 'admin', 'engineer'];

async function getUsers(req, res, next) {
  try {
    const users = await userModel.findAll();
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password_hash, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userModel.updateRole(req.params.id, role);
    const updated = await userModel.findById(req.params.id);
    const { password_hash, ...safeUser } = updated;
    return res.status(200).json(safeUser);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Delete all tickets owned by this user first (cascades to comments, attachments, etc.)
    await userModel.deleteUserData(req.params.id);
    await userModel.deleteById(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUserById, updateUserRole, deleteUser };
