# Implementation Plan: Backend Foundation

## Overview

Implement the three foundational pieces of the IT Helpdesk Ticketing System backend: environment configuration with startup validation, a MySQL2 connection pool, and a fully configured Express server with middleware, route stubs, 404 handling, and centralized error handling.

## Tasks

- [x] 1. Initialize backend project and install dependencies
  - Add `package.json` with `name`, `version`, `main: "server.js"`, and `"type": "module"` (or CommonJS — pick one and stay consistent)
  - Install runtime dependencies: `express`, `mysql2`, `dotenv`, `cors`
  - Install dev dependencies: `jest`, `supertest`, `fast-check`, `@jest/globals`
  - Add npm scripts: `"start": "node server.js"`, `"test": "jest --runInBand"`
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Configure environment variables
  - [x] 2.1 Populate `backend/.env` with all required variables
    - Add `PORT=3000`, `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=ticketing_db`, `JWT_SECRET`, `NODE_ENV=development`, `CORS_ORIGIN=http://localhost:5173`
    - _Requirements: 1.1, 1.4_
  - [x] 2.2 Create `backend/config/validateEnv.js` with a `validateEnv()` function
    - Define the list of required variable names: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
    - Iterate the list; collect any missing names
    - If any are missing, log a descriptive error listing the missing names and call `process.exit(1)`
    - Export `validateEnv` as a named export
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.3 Write unit tests for `validateEnv`
    - Test: all required vars present → function returns without throwing
    - Test: each required var removed one at a time → `process.exit(1)` is called (mock `process.exit`)
    - Test: multiple vars missing → single error message lists all missing names
    - _Requirements: 1.2, 1.3_

- [x] 3. Implement the MySQL2 connection pool
  - [x] 3.1 Write `backend/config/db.js`
    - Call `dotenv.config()` at the top (or rely on server.js calling it first — document the assumption)
    - Create a pool with `mysql2/promise` `createPool()` using env vars: `host`, `port`, `user`, `password`, `database`
    - Set `waitForConnections: true` and `connectionLimit: 10`
    - Export the pool as the default export
    - _Requirements: 2.1, 2.2, 2.5, 2.6_
  - [x] 3.2 Add a `connectDB()` function in `db.js` that runs `pool.query('SELECT 1')`
    - On success, log `"Database connected successfully"`
    - On failure, log the error and call `process.exit(1)`
    - Export `connectDB` as a named export
    - _Requirements: 2.3, 2.4_
  - [ ]* 3.3 Write unit tests for `db.js`
    - Mock `mysql2/promise` to verify pool is created with correct config values from env
    - Mock pool to reject `SELECT 1` → verify `process.exit(1)` is called
    - Verify the pool export is the same reference on repeated imports (singleton)
    - _Requirements: 2.2, 2.4, 2.5, 2.6_

- [x] 4. Create stub route files
  - [x] 4.1 Create `backend/routes/authRoutes.js` — export an Express Router with no handlers yet
  - [x] 4.2 Create `backend/routes/ticketRoutes.js` — export an Express Router with no handlers yet
  - [x] 4.3 Create `backend/routes/userRoutes.js` — export an Express Router with no handlers yet
  - [x] 4.4 Create `backend/routes/commentRoutes.js` — export an Express Router with no handlers yet
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Implement `backend/server.js`
  - [x] 5.1 Wire environment loading and DB connection
    - Import `dotenv` and call `dotenv.config()` as the very first statement
    - Import and call `validateEnv()`
    - Import `connectDB` from `config/db.js` and call it (await if async)
    - _Requirements: 1.1, 1.2, 2.3_
  - [x] 5.2 Apply middleware stack
    - Import and apply `cors` with `{ origin: process.env.CORS_ORIGIN }`
    - Apply `express.json()`
    - Apply `express.urlencoded({ extended: true })`
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 5.3 Mount routes and health check
    - Add `GET /api/health` inline handler returning `{ status: "ok" }`
    - Mount the four stub routers at `/api/auth`, `/api/tickets`, `/api/users`, `/api/comments`
    - _Requirements: 3.6, 4.1, 4.2, 4.3, 4.4_
  - [x] 5.4 Add 404 handler and Error_Handler
    - After all routes, add a catch-all middleware returning HTTP 404 `{ message: "Route not found" }`
    - Add the 4-argument Error_Handler: read `err.status || err.statusCode || 500`, build response body, include `stack` only when `NODE_ENV !== "production"`, call `console.error(err)`
    - _Requirements: 4.5, 5.1, 5.2, 5.3, 5.4_
  - [x] 5.5 Start the server and handle unhandled rejections
    - Call `app.listen(PORT, ...)` and log the port on success
    - Register `process.on('unhandledRejection', ...)` to log and exit
    - _Requirements: 3.1, 3.5, 5.5_

- [x] 6. Checkpoint — ensure the server starts cleanly
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify `node server.js` starts without errors (with a running MySQL instance or mocked)

- [x] 7. Write tests for server behavior
  - [x] 7.1 Write unit tests for the Error_Handler middleware
    - Test: `err.status` present → response uses that status
    - Test: `err.statusCode` present → response uses that status
    - Test: neither present → response uses 500
    - Test: `NODE_ENV=production` → response body has no `stack` field
    - Test: `NODE_ENV=development` → response body has `stack` field
    - Test: `console.error` is called for every error
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ]* 7.2 Write property test: error handler status code propagation (Property 4)
    - **Property 4: Error handler status code propagation**
    - **Validates: Requirements 5.2**
    - Use `fast-check` to generate arbitrary integers for `err.status` and `err.statusCode`; verify response status matches expected value
    - Tag: `Feature: backend-foundation, Property 4: error handler status propagation`
  - [ ]* 7.3 Write property test: stack trace hidden in production (Property 5)
    - **Property 5: Stack trace hidden in production**
    - **Validates: Requirements 5.3**
    - Use `fast-check` to generate arbitrary error messages; set `NODE_ENV=production`; verify `stack` is absent from response body
    - Tag: `Feature: backend-foundation, Property 5: stack trace hidden in production`
  - [ ]* 7.4 Write property test: stack trace present in non-production (Property 6)
    - **Property 6: Stack trace present in non-production**
    - **Validates: Requirements 5.3**
    - Use `fast-check` to generate arbitrary error messages; set `NODE_ENV=development`; verify `stack` is present in response body
    - Tag: `Feature: backend-foundation, Property 6: stack trace present in non-production`
  - [x] 7.5 Write integration tests for server routes using `supertest`
    - Test: `GET /api/health` → HTTP 200, body `{ status: "ok" }` (Property 2)
    - Test: `GET /api/unknown-route` → HTTP 404, body has `message` field
    - Test: `POST /api/health` with JSON body → middleware parses body correctly
    - _Requirements: 3.6, 4.5_
  - [ ]* 7.6 Write property test: unregistered routes return 404 (Property 3)
    - **Property 3: Unregistered routes return 404 with correct shape**
    - **Validates: Requirements 4.5**
    - Use `fast-check` to generate arbitrary path strings not in the route table; verify each returns HTTP 404 with a `message` field
    - Tag: `Feature: backend-foundation, Property 3: unknown routes return 404`

- [x] 8. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations each
- Unit tests use `jest` + `supertest` for HTTP assertions
- Route files are intentionally stubs — handlers are added in future feature specs
