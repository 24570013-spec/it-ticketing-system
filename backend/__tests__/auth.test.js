'use strict';

/**
 * Integration tests for auth endpoints
 * Requirements: 3.1-3.6, 4.1-4.6, 7.1-7.3
 */

// Mock DB and userModel BEFORE requiring the app
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn(), getConnection: jest.fn() },
}));

jest.mock('../models/userModel');

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.requireActual('jsonwebtoken').verify,
}));

const request = require('supertest');
const app = require('../server');
const userModel = require('../models/userModel');

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('missing name → 400 with required message', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('missing email → 400 with required message', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('missing password → 400 with required message', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('duplicate email → 409 with "Email already registered"', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: 'Email already registered' });
  });

  test('happy path → 201 with token and user shape', async () => {
    const { pool } = require('../config/db');
    userModel.findByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue(42);
    // createRefreshToken calls pool.query to INSERT the refresh token
    pool.query.mockResolvedValue([{ insertId: 1 }]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      token: 'test-token',
      user: {
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
      },
    });
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const existingUser = {
    id: 7,
    name: 'Bob',
    email: 'bob@example.com',
    password_hash: 'hashed_password',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default bcrypt.compare to true for happy-path tests
    const bcrypt = require('bcryptjs');
    bcrypt.compare.mockResolvedValue(true);
  });

  test('missing email → 400 with required message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('missing password → 400 with required message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('unknown email → 401 with "Invalid credentials"', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });

  test('wrong password → 401 with "Invalid credentials"', async () => {
    userModel.findByEmail.mockResolvedValue(existingUser);
    const bcrypt = require('bcryptjs');
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });

  test('happy path → 200 with token and user shape', async () => {
    const { pool } = require('../config/db');
    userModel.findByEmail.mockResolvedValue(existingUser);
    // createRefreshToken calls pool.query to INSERT the refresh token
    pool.query.mockResolvedValue([{ insertId: 1 }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      token: 'test-token',
      user: {
        id: 7,
        name: 'Bob',
        email: 'bob@example.com',
        role: 'user',
      },
    });
  });
});
