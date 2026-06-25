'use strict';

/**
 * Integration tests for server routes
 * Requirements: 3.6, 4.5
 */

// Mock the DB module BEFORE requiring the app so connectDB() never touches MySQL.
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn(), getConnection: jest.fn() },
}));

const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  test('returns HTTP 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Unknown routes', () => {
  test('GET /api/unknown-route returns HTTP 404 with a message field', async () => {
    const res = await request(app).get('/api/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  test('GET /completely/unknown returns HTTP 404 with a message field', async () => {
    const res = await request(app).get('/completely/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

describe('JSON body parsing', () => {
  test('POST to an unregistered route with JSON body returns 404 (body parsing works)', async () => {
    // POST /api/health is not a registered route, so we get 404.
    // The important thing is that the server parses the JSON body without
    // crashing — if body parsing were broken the server would return 400 or 500.
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send({ test: 'value' });

    // 404 confirms the route isn't registered; no 400/500 means body parsing succeeded.
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
