# Implementation Plan: Ticket Management

## Overview

Implement full CRUD for IT helpdesk tickets on top of the existing Express + MySQL + JWT foundation. Tasks follow dependency order: schema migration → model → controller → routes → wiring → tests.

## Tasks

- [x] 1. Create the tickets table migration
  - Create `backend/db/migrations/002_create_tickets_table.sql` with the DDL from the design doc
  - Include both foreign key constraints (`user_id` → `users.id`, `assigned_to` → `users.id`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement the Ticket model
  - [x] 2.1 Create `backend/models/ticketModel.js` with `create`, `findAll`, `findById`, `findByUserId`, `updateStatus`, `update`, and `deleteById`
    - Use `const { pool } = require('../config/db')` for all queries
    - `create()` inserts the row then SELECTs and returns the full row
    - `findAll()` and `findByUserId()` order results by `created_at DESC`
    - `update()` builds a dynamic SET clause from only the provided fields (map `assignedTo` → `assigned_to`)
    - All functions must be async and propagate DB errors to callers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 2.2 Write property test for create round-trip
    - Mock the DB pool; for any valid `{ title, description, priority, userId }`, `create()` then `findById()` should return a row with matching fields, `status === 'open'`, and `assigned_to === null`
    - **Property 1: Create round-trip**
    - **Validates: Requirements 1.3, 1.4, 2.1, 2.3**

  - [ ]* 2.3 Write property test for findByUserId filter correctness
    - Mock pool with tickets for multiple users; assert every returned row has the correct `user_id` and no foreign rows appear
    - **Property 3: findByUserId filter correctness**
    - **Validates: Requirements 2.4**

  - [ ]* 2.4 Write property test for updateStatus round-trip
    - For any valid status value, `updateStatus()` then `findById()` should reflect the new status with other fields unchanged
    - **Property 4: updateStatus round-trip**
    - **Validates: Requirements 2.5**

  - [ ]* 2.5 Write property test for update partial fields invariant
    - For any non-empty subset of updatable fields, `update()` should change only those fields
    - **Property 5: update partial fields invariant**
    - **Validates: Requirements 2.6**

  - [ ]* 2.6 Write property test for deleteById round-trip
    - `deleteById()` returns affectedRows 1; subsequent `findById()` returns null
    - **Property 6: deleteById round-trip**
    - **Validates: Requirements 2.7**

- [x] 3. Checkpoint — ensure all model tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the Ticket controller
  - [x] 4.1 Create `backend/controllers/ticketController.js` with `createTicket` handler
    - Validate `title` and `description` present and non-empty → 400 `"Title and description are required"`
    - Set `userId` from `req.user.id` (never from request body)
    - Call `ticketModel.create()`; return 201 with the full ticket row
    - Forward unexpected errors via `next(err)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test: create validates required fields
    - Generate requests missing or with whitespace-only `title` or `description`; assert 400
    - **Property 8: Create validates required fields**
    - **Validates: Requirements 3.3**

  - [x] 4.3 Add `getTickets` handler to `ticketController.js`
    - If `req.user.role === 'admin'` call `findAll()`; otherwise call `findByUserId(req.user.id)`
    - Return 200 with the array
    - _Requirements: 4.1, 4.2, 4.7_

  - [ ]* 4.4 Write property test: role-based list filtering
    - Admin request returns all tickets; user request returns only own tickets
    - **Property 9: Role-based list filtering**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 4.5 Add `getTicketById` handler to `ticketController.js`
    - Call `findById(req.params.id)`; 404 if null
    - If `req.user.role !== 'admin'` and `ticket.user_id !== req.user.id` → 403 `"Forbidden"`
    - Return 200 with the ticket row
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.6 Write property test: ownership enforcement on read
    - For any user and ticket owned by a different user, GET returns 403
    - **Property 10: Ownership enforcement on read and write**
    - **Validates: Requirements 4.5**

  - [x] 4.7 Add `updateTicket` handler to `ticketController.js`
    - Validate `status` against `['open','in_progress','resolved','closed']` if provided → 400 `"Invalid status value"`
    - Validate `priority` against `['low','medium','high']` if provided → 400 `"Invalid priority value"`
    - Call `findById(req.params.id)`; 404 if null
    - If `req.user.role !== 'admin'` and `ticket.user_id !== req.user.id` → 403 `"Forbidden"`
    - Strip `status` and `assigned_to` from the update payload when `req.user.role === 'user'`
    - Call `ticketModel.update()`; return 200 with the result of `findById()` after update
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 4.8 Write property test: enum validation on update
    - Generate invalid status and priority strings; assert 400 with correct message
    - **Property 11: Enum validation on update**
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 4.9 Write property test: update round-trip
    - Valid PUT returns 200 with response body reflecting all updated fields
    - **Property 12: Update round-trip**
    - **Validates: Requirements 5.7**

  - [x] 4.10 Add `deleteTicket` handler to `ticketController.js`
    - Call `findById(req.params.id)`; 404 if null
    - Call `deleteById(id)`; return 200 `{ message: "Ticket deleted successfully" }`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.11 Write property test: deleteById round-trip via HTTP
    - Admin DELETE on existing ticket returns 200; subsequent GET returns 404
    - **Property 6 (HTTP layer): deleteById round-trip**
    - **Validates: Requirements 6.1, 6.2**

- [x] 5. Checkpoint — ensure all controller tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create ticket routes and wire into server
  - [x] 6.1 Create `backend/routes/ticketRoutes.js`
    - Import `{ authenticate }` from `../middleware/authMiddleware`
    - Import `{ requireRole }` from `../middleware/roleMiddleware`
    - Mount all five routes as specified in the design: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id` (with `requireRole('admin')`)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Register ticket routes in `backend/server.js`
    - Verify `app.use('/api/tickets', ticketRoutes)` is present (already stubbed in server.js)
    - _Requirements: 7.6_

- [x] 7. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in `devDependencies`) with a minimum of 100 iterations each
- Tag each property test file with: `// Feature: ticket-management, Property N: <property text>`
- `ticketRoutes.js` is already imported in `server.js` — just ensure the file exists and exports the router
- The `update()` model method must build a dynamic SET clause; never pass `undefined` values to the query
- Always fetch the full row via `findById()` after create/update to return consistent response shapes
