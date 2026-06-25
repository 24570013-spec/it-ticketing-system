'use strict';

/**
 * Integration tests for comment controller endpoints
 * Feature: comment-management
 * Requirements: 3.1–3.5, 4.1–4.5, 5.1–5.4
 */

jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn() },
}));

jest.mock('../models/commentModel');
jest.mock('../models/ticketModel');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const commentModel = require('../models/commentModel');
const ticketModel = require('../models/ticketModel');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(payload = { id: 1, email: 'user@test.com', role: 'user' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function makeAdminToken() {
  return makeToken({ id: 99, email: 'admin@test.com', role: 'admin' });
}

function makeTicket(overrides = {}) {
  return { id: 10, title: 'Test', user_id: 1, status: 'open', ...overrides };
}

function makeComment(overrides = {}) {
  return {
    id: 1,
    ticket_id: 10,
    user_id: 1,
    content: 'A comment',
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── POST /api/tickets/:ticketId/comments ─────────────────────────────────────

describe('POST /api/tickets/:ticketId/comments — addComment', () => {
  test('400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });

  test('400 when content is whitespace-only', async () => {
    const res = await request(app)
      .post('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });

  test('404 when ticket does not exist', async () => {
    ticketModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/tickets/999/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ content: 'Hello' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Ticket not found');
  });

  test('201 with full comment row on success', async () => {
    ticketModel.findById.mockResolvedValue(makeTicket());
    const comment = makeComment({ content: 'Hello' });
    commentModel.create.mockResolvedValue(comment);

    const res = await request(app)
      .post('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ content: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body.ticket_id).toBe(10);
    expect(res.body.content).toBe('Hello');
    // user_id must come from req.user.id, not body
    expect(res.body.user_id).toBe(1);
  });

  test('401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/tickets/10/comments')
      .send({ content: 'Hello' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/tickets/:ticketId/comments ──────────────────────────────────────

describe('GET /api/tickets/:ticketId/comments — getComments', () => {
  test('404 when ticket does not exist', async () => {
    ticketModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tickets/999/comments')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Ticket not found');
  });

  test('403 when regular user tries to read another user\'s ticket comments', async () => {
    ticketModel.findById.mockResolvedValue(makeTicket({ user_id: 99 })); // owned by user 99

    const res = await request(app)
      .get('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeToken({ id: 1, role: 'user' })}`); // user 1

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  test('200 with comments when owner reads own ticket', async () => {
    ticketModel.findById.mockResolvedValue(makeTicket({ user_id: 1 }));
    const comments = [makeComment({ id: 1 }), makeComment({ id: 2 })];
    commentModel.findByTicketId.mockResolvedValue(comments);

    const res = await request(app)
      .get('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeToken({ id: 1, role: 'user' })}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('200 when admin reads any ticket comments', async () => {
    ticketModel.findById.mockResolvedValue(makeTicket({ user_id: 99 }));
    const comments = [makeComment()];
    commentModel.findByTicketId.mockResolvedValue(comments);

    const res = await request(app)
      .get('/api/tickets/10/comments')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ─── DELETE /api/comments/:id ────────────────────────────────────────────────

describe('DELETE /api/comments/:id — deleteComment', () => {
  test('403 when non-admin tries to delete a comment', async () => {
    const res = await request(app)
      .delete('/api/comments/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(403);
  });

  test('404 when comment does not exist (admin)', async () => {
    commentModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/comments/999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Comment not found');
  });

  test('200 with success message when admin deletes a comment', async () => {
    commentModel.findById.mockResolvedValue(makeComment());
    commentModel.deleteById.mockResolvedValue(1);

    const res = await request(app)
      .delete('/api/comments/1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment deleted successfully');
  });

  test('401 when no token', async () => {
    const res = await request(app).delete('/api/comments/1');
    expect(res.status).toBe(401);
  });
});
