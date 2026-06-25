'use strict';

// Feature: user-authentication, Property 1: Password hash is never the plaintext password
// Feature: user-authentication, Property 2: bcrypt round-trip — hash then compare succeeds
// Feature: user-authentication, Property 3: bcrypt compare rejects wrong password
// Feature: user-authentication, Property 4: JWT round-trip — sign then verify recovers payload

const fc = require('fast-check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// bcrypt is intentionally slow (cost factor 10 ≈ 100ms per hash).
// We use a lower cost factor (4) for tests to keep them fast while
// still verifying the cryptographic properties hold.
const TEST_COST = 4;

// ─── Property 1: Password hash is never the plaintext ──────────────────────
// Validates: Requirements 3.5

describe('Property 1: Password hash is never the plaintext password', () => {
  test('for any non-empty string, bcrypt.hash result !== plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (plaintext) => {
          const hash = await bcrypt.hash(plaintext, TEST_COST);
          expect(hash).not.toBe(plaintext);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});

// ─── Property 2: bcrypt round-trip — hash then compare succeeds ───────────
// Validates: Requirements 4.1

describe('Property 2: bcrypt round-trip — hash then compare succeeds', () => {
  test('for any non-empty string, hash then compare with same string returns true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (plaintext) => {
          const hash = await bcrypt.hash(plaintext, TEST_COST);
          const result = await bcrypt.compare(plaintext, hash);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});

// ─── Property 3: bcrypt compare rejects different password ────────────────
// Validates: Requirements 4.5

describe('Property 3: bcrypt compare rejects wrong password', () => {
  test('for any two distinct strings, hash a then compare b returns false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 })
        ).filter(([a, b]) => a !== b),
        async ([a, b]) => {
          const hash = await bcrypt.hash(a, TEST_COST);
          const result = await bcrypt.compare(b, hash);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});

// ─── Property 4: JWT round-trip recovers payload ──────────────────────────
// Validates: Requirements 3.6, 4.6

describe('Property 4: JWT round-trip — sign then verify recovers payload', () => {
  test('for any valid payload, sign then verify returns the original id, email, and role', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('user', 'admin'),
        }),
        (payload) => {
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
          const decoded = jwt.verify(token, JWT_SECRET);
          expect(decoded.id).toBe(payload.id);
          expect(decoded.email).toBe(payload.email);
          expect(decoded.role).toBe(payload.role);
        }
      ),
      { numRuns: 100 }
    );
  });
});
