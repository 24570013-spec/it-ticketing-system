# Implementation Plan: User Authentication

## Overview

Implement registration, login, JWT middleware, and role-based access control on top of the existing Express + MySQL foundation. Tasks follow the dependency order: schema → model → controller → middleware → routes → wiring.

## Tasks

- [x] 1. Install dependencies and create the users table migration
  - Run `npm install bcryptjs jsonwebtoken` inside `backend/`
  - Create `backend/db/migrations/001_create_users_table.sql` with the DDL from the design doc
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement the User model
  - [x] 2.1 Create `backend/models/userModel.js` with `findByEmail`, `createUser`, and `findById`
    - Use the shared pool from `backend/config/db.js`
    - All functions must be async and propagate DB errors to callers
    - `findByEmail` and `findById` return the full row or `null`
    - `createUser` returns the `insertId` of the new row
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for User model round-trip
    - Mock the DB pool; for any valid `{ name, email, passwordHash, role }`, `createUser` then `findById` should return a row with matching fields
    - **Property 2 (combined 2.1/2.3): User model round-trip**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.3 Write unit tests for User model error propagation
    - Mock pool to throw; verify each method rejects with the same error
    - _Requirements: 2.4_

- [x] 3. Implement the Auth controller
  - [x] 3.1 Create `backend/controllers/authController.js` with `register` handler
    - Validate `name`, `email`, `password` present and non-empty → 400 if missing
    - Call `findByEmail`; if row exists → 409
    - Hash password with `bcryptjs` (cost factor 10)
    - Call `createUser`; sign JWT `{ id, email, role }` with `JWT_SECRET`, `expiresIn: '7d'`
    - Return 201 `{ token, user: { id, name, email, role } }`
    - Forward unexpected errors via `next(err)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.2 Write property test: register rejects any combination of missing fields → 400
    - Use `fast-check` to generate objects missing at least one of `name/email/password`
    - **Property 5: Registration with missing fields returns 400**
    - **Validates: Requirements 3.3**

  - [ ]* 3.3 Write unit tests for register handler
    - Happy path: mock model + bcrypt + jwt, assert 201 + response shape
    - Duplicate email: mock `findByEmail` returning a row, assert 409
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.4 Add `login` handler to `backend/controllers/authController.js`
    - Validate `email`, `password` present and non-empty → 400 if missing
    - Call `findByEmail`; if null → 401 `"Invalid credentials"`
    - Call `bcrypt.compare`; if false → 401 `"Invalid credentials"`
    - Sign JWT `{ id, email, role }` with `JWT_SECRET`, `expiresIn: '7d'`
    - Return 200 `{ token, user: { id, name, email, role } }`
    - Forward unexpected errors via `next(err)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 3.5 Write property test: login rejects any combination of missing fields → 400
    - Use `fast-check` to generate objects missing at least one of `email/password`
    - **Property 6: Login with missing fields returns 400**
    - **Validates: Requirements 4.3**

  - [ ]* 3.6 Write unit tests for login handler
    - Happy path: mock model + bcrypt + jwt, assert 200 + response shape
    - Unknown email: mock `findByEmail` returning null, assert 401
    - Wrong password: mock `bcrypt.compare` returning false, assert 401
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 4. Checkpoint — ensure all tests pass
  - Run `npm test` inside `backend/`; resolve any failures before continuing

- [x] 5. Implement bcrypt and JWT correctness property tests
  - [x]* 5.1 Write property test: password hash is never the plaintext
    - `fc.string({ minLength: 1 })` → `bcrypt.hash` → assert `hash !== plaintext`
    - **Property 1: Password hash is never the plaintext password**
    - **Validates: Requirements 3.5**

  - [x]* 5.2 Write property test: bcrypt round-trip success
    - `fc.string({ minLength: 1 })` → hash → `bcrypt.compare` same string → assert `true`
    - **Property 2: bcrypt round-trip — hash then compare succeeds**
    - **Validates: Requirements 4.1**

  - [x]* 5.3 Write property test: bcrypt compare rejects different password
    - `fc.tuple(fc.string(), fc.string()).filter(([a,b]) => a !== b)` → hash `a` → compare `b` → assert `false`
    - **Property 3: bcrypt compare rejects wrong password**
    - **Validates: Requirements 4.5**

  - [x]* 5.4 Write property test: JWT round-trip recovers payload
    - `fc.record({ id: fc.integer({ min: 1 }), email: fc.emailAddress(), role: fc.constantFrom('user','admin') })` → `jwt.sign` → `jwt.verify` → assert payload fields match
    - **Property 4: JWT round-trip — sign then verify recovers payload**
    - **Validates: Requirements 3.6, 4.6**

- [x] 6. Implement the Auth middleware
  - [x] 6.1 Create `backend/middleware/authMiddleware.js` with `authenticate` function
    - Extract token from `Authorization: Bearer <token>` header
    - Missing or non-Bearer header → 401 `"No token provided"`
    - Call `jwt.verify(token, JWT_SECRET)`; on error → 401 `"Invalid or expired token"`
    - On success: set `req.user = decoded` and call `next()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write property test: auth middleware rejects requests without a valid Bearer token
    - Generate arbitrary strings that are not valid JWTs; assert 401 is returned and `next` is not called
    - Also test missing header and non-Bearer scheme
    - **Property 7: Auth middleware rejects requests without a valid Bearer token**
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 6.3 Write unit tests for auth middleware happy path
    - Sign a real JWT with the test secret; assert `req.user` is populated and `next()` is called
    - _Requirements: 5.2_

- [x] 7. Implement the Role middleware
  - [x] 7.1 Create `backend/middleware/roleMiddleware.js` with `requireRole(...roles)` factory
    - Returns middleware that checks `req.user.role` against the `roles` array
    - Role in array → call `next()`
    - Role not in array → 403 `"Forbidden"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 7.2 Write property test: role middleware allows iff role is in permitted set
    - `fc.tuple(fc.constantFrom('user','admin'), fc.subarray(['user','admin']))` → assert `next()` called iff role is in the subarray
    - **Property 8: Role middleware allows only permitted roles**
    - **Validates: Requirements 6.2, 6.3**

- [x] 8. Wire auth routes
  - Update `backend/routes/authRoutes.js` to import `{ register, login }` from the auth controller and mount `POST /register` and `POST /login`
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Final checkpoint — ensure all tests pass
  - Run `npm test` inside `backend/`; resolve any failures before marking the feature complete

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in `devDependencies`) with a minimum of 100 iterations each
- Each property test file should include the tag comment: `// Feature: user-authentication, Property N: <property text>`
- `bcryptjs` is the pure-JS bcrypt implementation — no native build step needed
- The `authenticate` middleware must always be applied before `requireRole` on any protected route
