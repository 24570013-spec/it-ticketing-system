'use strict';

/**
 * Tests for Comment model
 * Feature: comment-management
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn() },
}));

const { pool } = require('../config/db');
const commentModel = require('../models/commentModel');

function makeCommentRow({
  id = 1,
  ticketId = 10,
  userId = 5,
  content = 'Test comment',
  createdAt = new Date('2024-01-15T09:00:00Z'),
} = {}) {
  return {
    id,
    ticket_id: ticketId,
    user_id: userId,
    content,
    created_at: createdAt,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── create() ────────────────────────────────────────────────────────────────

describe('commentModel.create()', () => {
  test('inserts a comment and returns the full row via findById', async () => {
    const row = makeCommentRow({ id: 1, ticketId: 10, userId: 5, content: 'Hello' });

    pool.query
      .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT
      .mockResolvedValueOnce([[row]]);            // SELECT (findById)

    const result = await commentModel.create({ ticketId: 10, userId: 5, content: 'Hello' });

    expect(result).not.toBeNull();
    expect(result.id).toBe(1);
    expect(result.ticket_id).toBe(10);
    expect(result.user_id).toBe(5);
    expect(result.content).toBe('Hello');
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(commentModel.create({ ticketId: 1, userId: 1, content: 'x' })).rejects.toThrow('DB error');
  });
});

// ─── findByTicketId() ─────────────────────────────────────────────────────────

describe('commentModel.findByTicketId()', () => {
  test('returns all comments for the given ticketId ordered ASC', async () => {
    const rows = [
      makeCommentRow({ id: 1, ticketId: 10, createdAt: new Date('2024-01-01') }),
      makeCommentRow({ id: 2, ticketId: 10, createdAt: new Date('2024-01-02') }),
    ];
    pool.query.mockResolvedValueOnce([rows]);

    const result = await commentModel.findByTicketId(10);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    // All rows must have the correct ticket_id
    result.forEach(r => expect(r.ticket_id).toBe(10));
  });

  test('returns empty array when no comments exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const result = await commentModel.findByTicketId(999);
    expect(result).toEqual([]);
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(commentModel.findByTicketId(1)).rejects.toThrow('DB error');
  });
});

// ─── findById() ───────────────────────────────────────────────────────────────

describe('commentModel.findById()', () => {
  test('returns the comment row when found', async () => {
    const row = makeCommentRow({ id: 7 });
    pool.query.mockResolvedValueOnce([[row]]);

    const result = await commentModel.findById(7);
    expect(result).not.toBeNull();
    expect(result.id).toBe(7);
  });

  test('returns null when comment does not exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const result = await commentModel.findById(999);
    expect(result).toBeNull();
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(commentModel.findById(1)).rejects.toThrow('DB error');
  });
});

// ─── deleteById() ─────────────────────────────────────────────────────────────

describe('commentModel.deleteById()', () => {
  test('returns affectedRows 1 when comment is deleted', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const affected = await commentModel.deleteById(1);
    expect(affected).toBe(1);
  });

  test('returns 0 when comment does not exist', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const affected = await commentModel.deleteById(999);
    expect(affected).toBe(0);
  });

  test('propagates DB errors to callers', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(commentModel.deleteById(1)).rejects.toThrow('DB error');
  });
});

// ─── deleteById round-trip ────────────────────────────────────────────────────

describe('commentModel deleteById round-trip', () => {
  test('deleteById() returns affectedRows 1 and subsequent findById() returns null', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // DELETE
      .mockResolvedValueOnce([[/*empty*/]]);          // SELECT → null

    const affected = await commentModel.deleteById(42);
    expect(affected).toBe(1);

    const found = await commentModel.findById(42);
    expect(found).toBeNull();
  });
});
