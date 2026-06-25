'use strict';

/**
 * Integration tests for user controller endpoints
 * Feature: user-management
 * Requirements: 2.1–2.3, 3.1–3.3, 4.1–4.4, 5.1–5.4
 */

jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn() },
}));

jest.mock('../models/userModel');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const userModel = require('../models/userModel');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAdminToken() {
  return jwt.sign({ id: 99, email: 'admin@test.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function makeUserToken() {
  return jwt.sign({ id: 1, email: 'user@test.com', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function makeUser(overrides = {}) {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@test.com',
    password_hash: 'hashed',
    role: 'user',
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /api/users ────────────────────────────────────────────────────────────

describe('GET /api/users — getUsers', () => {
  test('401 when no token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('403 when non-admin user', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeUserToken()}`);
    expect(res.status).toBe(403);
  });

  test('200 with array of users (no password_hash) for admin', async () => {
    userModel.findAll.mockResolvedValue([
      { id: 1, name: 'Alice', email: 'alice@test.com', role: 'user', created_at: new Date() },
      { id: 2, name: 'Bob',   email: 'bob@test.com',   role: 'admin', created_at: new Date() },
    ]);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach(u => expect(u).not.toHaveProperty('password_hash'));
  });
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────────

describe('GET /api/users/:id — getUserById', () => {
  test('404 when user does not exist', async () => {
    userModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  test('200 with user data (no password_hash) when found', async () => {
    userModel.findById.mockResolvedValue(makeUser());

    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('403 when non-admin user', async () => {
    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${makeUserToken()}`);
    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/users/:id/role ───────────────────────────────────────────────────

describe('PUT /api/users/:id/role — updateUserRole', () => {
  test('400 when role is invalid', async () => {
    const res = await request(app)
      .put('/api/users/1/role')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid role value');
  });

  test('404 when user does not exist', async () => {
    userModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/users/999/role')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  test('200 with updated user (no password_hash) on success', async () => {
    const updatedUser = makeUser({ role: 'admin' });
    userModel.findById
      .mockResolvedValueOnce(makeUser())      // first call: check user exists
      .mockResolvedValueOnce(updatedUser);    // second call: return updated user
    userModel.updateRole.mockResolvedValue(1);

    const res = await request(app)
      .put('/api/users/1/role')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('403 when non-admin', async () => {
    const res = await request(app)
      .put('/api/users/1/role')
      .set('Authorization', `Bearer ${makeUserToken()}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/users/:id ─────────────────────────────────────────────────────

describe('DELETE /api/users/:id — deleteUser', () => {
  test('404 when user does not exist', async () => {
    userModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  test('200 with success message when user is deleted', async () => {
    userModel.findById.mockResolvedValue(makeUser());
    userModel.deleteById.mockResolvedValue(1);

    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deleted successfully');
  });

  test('403 when non-admin', async () => {
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${makeUserToken()}`);
    expect(res.status).toBe(403);
  });

  test('401 when no token', async () => {
    const res = await request(app).delete('/api/users/1');
    expect(res.status).toBe(401);
  });
});
