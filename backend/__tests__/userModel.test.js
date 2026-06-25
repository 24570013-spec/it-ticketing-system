'use strict';

/**
 * Tests for User model extensions
 * Feature: user-management
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn() },
}));

const { pool } = require('../config/db');
const userModel = require('../models/userModel');

function makeUserRow(overrides = {}) {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    password_hash: 'hashed',
    role: 'user',
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── findAll() ────────────────────────────────────────────────────────────────

describe('userModel.findAll()', () => {
  test('returns all users without password_hash', async () => {
    const rows = [
      { id: 1, name: 'Alice', email: 'alice@test.com', role: 'user', created_at: new Date() },
      { id: 2, name: 'Bob',   email: 'bob@test.com',   role: 'admin', created_at: new Date() },
    ];
    pool.query.mockResolvedValueOnce([rows]);

    const result = await userModel.findAll();

    expect(result).toHaveLength(2);
    // password_hash must never appear in findAll results
    result.forEach(u => {
      expect(u).not.toHaveProperty('password_hash');
    });
  });

  test('returns empty array when no users exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const result = await userModel.findAll();
    expect(result).toEqual([]);
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(userModel.findAll()).rejects.toThrow('DB error');
  });
});

// ─── updateRole() ─────────────────────────────────────────────────────────────

describe('userModel.updateRole()', () => {
  test('returns affectedRows 1 on successful update', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const result = await userModel.updateRole(1, 'admin');
    expect(result).toBe(1);
  });

  test('returns 0 when user does not exist', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const result = await userModel.updateRole(999, 'admin');
    expect(result).toBe(0);
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(userModel.updateRole(1, 'admin')).rejects.toThrow('DB error');
  });
});

// ─── updateRole round-trip ────────────────────────────────────────────────────

describe('userModel updateRole round-trip', () => {
  test('updateRole() then findById() reflects new role', async () => {
    const updatedUser = makeUserRow({ role: 'admin' });

    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[updatedUser]]);          // SELECT (findById)

    const affected = await userModel.updateRole(1, 'admin');
    expect(affected).toBe(1);

    const found = await userModel.findById(1);
    expect(found).not.toBeNull();
    expect(found.role).toBe('admin');
  });
});

// ─── deleteById() ─────────────────────────────────────────────────────────────

describe('userModel.deleteById()', () => {
  test('returns affectedRows 1 on successful delete', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const result = await userModel.deleteById(1);
    expect(result).toBe(1);
  });

  test('returns 0 when user does not exist', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const result = await userModel.deleteById(999);
    expect(result).toBe(0);
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(userModel.deleteById(1)).rejects.toThrow('DB error');
  });
});

// ─── deleteById round-trip ────────────────────────────────────────────────────

describe('userModel deleteById round-trip', () => {
  test('deleteById() returns affectedRows 1 and subsequent findById() returns null', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // DELETE
      .mockResolvedValueOnce([[/*empty*/]]);           // SELECT (findById) → null

    const affected = await userModel.deleteById(1);
    expect(affected).toBe(1);

    const found = await userModel.findById(1);
    expect(found).toBeNull();
  });
});
