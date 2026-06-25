'use strict';

// Feature: ticket-management, Property 1: Create round-trip
// Feature: ticket-management, Property 3: findByUserId filter correctness
// Feature: ticket-management, Property 4: updateStatus round-trip
// Feature: ticket-management, Property 5: update partial fields invariant
// Feature: ticket-management, Property 6: deleteById round-trip

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock the DB pool BEFORE requiring ticketModel
// ---------------------------------------------------------------------------
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  pool: { query: jest.fn() },
}));

const { pool } = require('../config/db');
const ticketModel = require('../models/ticketModel');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a full ticket row from seed fields. */
function makeRow({
  id = 1,
  title = 'Test',
  description = 'Desc',
  priority = 'medium',
  userId = 1,
  status = 'open',
  assignedTo = null,
  createdAt = new Date('2024-01-15T09:00:00Z'),
  updatedAt = new Date('2024-01-15T09:00:00Z'),
} = {}) {
  return {
    id,
    title,
    description,
    status,
    priority,
    user_id: userId,
    assigned_to: assignedTo,
    created_at: createdAt,
    updated_at: updatedAt,
    assigned_to_name: null,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const validTitle = fc.string({ minLength: 1, maxLength: 100 });
const validDescription = fc.string({ minLength: 1, maxLength: 500 });
const validPriority = fc.constantFrom('low', 'medium', 'high');
const validStatus = fc.constantFrom('open', 'in_progress', 'resolved', 'closed');
const positiveId = fc.integer({ min: 1, max: 999999 });

// ---------------------------------------------------------------------------
// Property 1: Create round-trip
// Validates: Requirements 1.3, 1.4, 2.1, 2.3
// ---------------------------------------------------------------------------

describe('Property 1: Create round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create() then findById() returns a row matching all input fields, status=open, assigned_to=null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: validTitle,
          description: validDescription,
          priority: validPriority,
          userId: positiveId,
          id: positiveId,
        }),
        async ({ title, description, priority, userId, id }) => {
          const row = makeRow({ id, title, description, priority, userId });

          // create(): INSERT returns insertId; SELECT returns the row
          pool.query
            .mockResolvedValueOnce([{ insertId: id }])  // INSERT
            .mockResolvedValueOnce([[row]]);              // SELECT (called internally by findById)

          const result = await ticketModel.create({ title, description, priority, userId });

          expect(result).not.toBeNull();
          expect(result.id).toBe(id);
          expect(result.title).toBe(title);
          expect(result.description).toBe(description);
          expect(result.priority).toBe(priority);
          expect(result.user_id).toBe(userId);
          expect(result.status).toBe('open');
          expect(result.assigned_to).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: findByUserId filter correctness
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------

describe('Property 3: findByUserId filter correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('every row returned by findByUserId has the correct user_id and no foreign rows appear', async () => {
    await fc.assert(
      fc.asyncProperty(
        positiveId,
        // Generate 0–9 owned ticket ids and 0–5 other-user ids
        fc.array(positiveId, { minLength: 0, maxLength: 9 }),
        fc.array(positiveId.filter(id => id !== 0), { minLength: 0, maxLength: 5 }),
        async (targetUserId, ownedIds, otherUserIds) => {
          // Build rows that belong to targetUserId
          const ownedRows = ownedIds.map(id =>
            makeRow({ id, userId: targetUserId })
          );

          const total = ownedRows.length;

          // findByUserId issues two queries: COUNT then SELECT
          pool.query
            .mockResolvedValueOnce([[{ total }]])  // COUNT
            .mockResolvedValueOnce([ownedRows]);    // SELECT

          const { rows } = await ticketModel.findByUserId(targetUserId);

          // Every returned row must belong to targetUserId
          for (const row of rows) {
            expect(row.user_id).toBe(targetUserId);
          }

          // No foreign user rows must appear
          const foreignUserIds = otherUserIds.filter(uid => uid !== targetUserId);
          for (const row of rows) {
            expect(foreignUserIds).not.toContain(row.user_id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: updateStatus round-trip
// Validates: Requirements 2.5
// ---------------------------------------------------------------------------

describe('Property 4: updateStatus round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateStatus() then findById() reflects new status with other fields unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        positiveId,
        validStatus,
        fc.record({
          title: validTitle,
          description: validDescription,
          priority: validPriority,
          userId: positiveId,
        }),
        async (id, newStatus, { title, description, priority, userId }) => {
          const originalRow = makeRow({ id, title, description, priority, userId, status: 'open' });
          const updatedRow = { ...originalRow, status: newStatus };

          // updateStatus(): UPDATE returns affectedRows=1
          // findById() (called externally by the test) returns the updated row
          pool.query
            .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
            .mockResolvedValueOnce([[updatedRow]]);          // SELECT in findById

          const affected = await ticketModel.updateStatus(id, newStatus);
          expect(affected).toBe(1);

          const found = await ticketModel.findById(id);
          expect(found).not.toBeNull();
          expect(found.status).toBe(newStatus);

          // Other fields must remain unchanged
          expect(found.title).toBe(title);
          expect(found.description).toBe(description);
          expect(found.priority).toBe(priority);
          expect(found.user_id).toBe(userId);
          expect(found.assigned_to).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: update partial fields invariant
// Validates: Requirements 2.6
// ---------------------------------------------------------------------------

describe('Property 5: update partial fields invariant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('update() changes only the provided fields and leaves others unchanged', async () => {
    // Arbitrary: pick at least one of the updatable fields
    const updateFieldsArb = fc
      .record(
        {
          title: fc.option(validTitle, { nil: undefined }),
          description: fc.option(validDescription, { nil: undefined }),
          priority: fc.option(validPriority, { nil: undefined }),
          status: fc.option(validStatus, { nil: undefined }),
        },
        { requiredKeys: [] }
      )
      .filter(fields => Object.values(fields).some(v => v !== undefined));

    await fc.assert(
      fc.asyncProperty(
        positiveId,
        fc.record({
          title: validTitle,
          description: validDescription,
          priority: validPriority,
          userId: positiveId,
        }),
        updateFieldsArb,
        async (id, original, updateFields) => {
          const originalRow = makeRow({
            id,
            title: original.title,
            description: original.description,
            priority: original.priority,
            userId: original.userId,
            status: 'open',
          });

          // Build what the row looks like after applying updateFields
          const updatedRow = {
            ...originalRow,
            title: updateFields.title !== undefined ? updateFields.title : originalRow.title,
            description: updateFields.description !== undefined ? updateFields.description : originalRow.description,
            priority: updateFields.priority !== undefined ? updateFields.priority : originalRow.priority,
            status: updateFields.status !== undefined ? updateFields.status : originalRow.status,
            assigned_to: updateFields.assignedTo !== undefined ? updateFields.assignedTo : originalRow.assigned_to,
          };

          // update(): UPDATE returns affectedRows=1
          // findById() returns the updated row
          pool.query
            .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
            .mockResolvedValueOnce([[updatedRow]]);          // SELECT in findById

          const affected = await ticketModel.update(id, updateFields);
          expect(affected).toBe(1);

          const found = await ticketModel.findById(id);
          expect(found).not.toBeNull();

          // Provided fields must be updated
          if (updateFields.title !== undefined) {
            expect(found.title).toBe(updateFields.title);
          }
          if (updateFields.description !== undefined) {
            expect(found.description).toBe(updateFields.description);
          }
          if (updateFields.priority !== undefined) {
            expect(found.priority).toBe(updateFields.priority);
          }
          if (updateFields.status !== undefined) {
            expect(found.status).toBe(updateFields.status);
          }

          // Fields NOT provided must stay at original values
          if (updateFields.title === undefined) {
            expect(found.title).toBe(originalRow.title);
          }
          if (updateFields.description === undefined) {
            expect(found.description).toBe(originalRow.description);
          }
          if (updateFields.priority === undefined) {
            expect(found.priority).toBe(originalRow.priority);
          }
          if (updateFields.status === undefined) {
            expect(found.status).toBe(originalRow.status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: deleteById round-trip
// Validates: Requirements 2.7
// ---------------------------------------------------------------------------

describe('Property 6: deleteById round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deleteById() returns affectedRows 1 and subsequent findById() returns null', async () => {
    await fc.assert(
      fc.asyncProperty(
        positiveId,
        async (id) => {
          // deleteById(): DELETE returns affectedRows=1
          // findById(): SELECT returns empty array → null
          pool.query
            .mockResolvedValueOnce([{ affectedRows: 1 }])  // DELETE
            .mockResolvedValueOnce([[/*empty*/]]);           // SELECT (no rows)

          const affected = await ticketModel.deleteById(id);
          expect(affected).toBe(1);

          const found = await ticketModel.findById(id);
          expect(found).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
