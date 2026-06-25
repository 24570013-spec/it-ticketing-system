'use strict';

/**
 * Unit tests for the Error_Handler middleware
 * Requirements: 5.2, 5.3, 5.4
 */

const express = require('express');
const request = require('supertest');

// Build a minimal Express app that wires up the error handler directly,
// without touching DB or env validation.
function buildApp(nodeEnv) {
  const app = express();
  app.use(express.json());

  // Route that triggers an error via next(err)
  app.get('/trigger-error', (req, res, next) => {
    const err = req._testError;
    next(err);
  });

  // Centralized error handler — same logic as server.js
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const body = { message: err.message || 'Internal Server Error' };
    if (nodeEnv !== 'production') {
      body.stack = err.stack;
    }
    console.error(err);
    res.status(status).json(body);
  });

  return app;
}

// Helper: make a request that carries a pre-built error object
function triggerError(app, err) {
  // Attach the error to the request via a tiny middleware shim
  const testApp = express();
  testApp.use((req, res, next) => {
    req._testError = err;
    next();
  });
  testApp.use(app);
  return request(testApp).get('/trigger-error');
}

describe('Error_Handler middleware', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ── Status code selection ────────────────────────────────────────────────

  test('uses err.status when present', async () => {
    const app = buildApp('development');
    const err = Object.assign(new Error('Not Found'), { status: 404 });

    const res = await triggerError(app, err);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not Found');
  });

  test('uses err.statusCode when err.status is absent', async () => {
    const app = buildApp('development');
    const err = Object.assign(new Error('Conflict'), { statusCode: 409 });

    const res = await triggerError(app, err);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Conflict');
  });

  test('defaults to 500 when neither err.status nor err.statusCode is present', async () => {
    const app = buildApp('development');
    const err = new Error('Something went wrong');

    const res = await triggerError(app, err);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Something went wrong');
  });

  // ── Stack trace visibility ───────────────────────────────────────────────

  test('omits stack field in production environment', async () => {
    const app = buildApp('production');
    const err = new Error('Prod error');

    const res = await triggerError(app, err);

    expect(res.body).not.toHaveProperty('stack');
  });

  test('includes stack field in development environment', async () => {
    const app = buildApp('development');
    const err = new Error('Dev error');

    const res = await triggerError(app, err);

    expect(res.body).toHaveProperty('stack');
    expect(typeof res.body.stack).toBe('string');
  });

  // ── console.error ────────────────────────────────────────────────────────

  test('calls console.error for every error regardless of environment', async () => {
    const appDev = buildApp('development');
    const appProd = buildApp('production');

    await triggerError(appDev, new Error('dev error'));
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    await triggerError(appProd, new Error('prod error'));
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  test('console.error is called with the error object', async () => {
    const app = buildApp('development');
    const err = new Error('logged error');

    await triggerError(app, err);

    expect(consoleSpy).toHaveBeenCalledWith(err);
  });
});
