# Implementation Plan: Comment Management

## Overview

Implement comment CRUD on top of the existing Express + MySQL + JWT foundation. Tasks follow dependency order: schema migration → model → controller → routes → wiring.

## Tasks

- [x] 1. Create the comments table migration
  - Create `backend/db/migrations/003_create_comments_table.sql` with the DDL from the design doc
  - Include both foreign key constraints (`ticket_id` → `tickets.id`, `user_id` → `users.id`)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement the Comment model
  - [x] 2.1 Create `backend/models/commentModel.js` with `create`, `findByTicketId`, `findById`, and `deleteById`
    - Use `const { pool } = require('../config/db')` for all queries
    - `create()` inserts the row then SELECTs and returns the full row by `insertId`
    - `findByTicketId()` orders results by `created_at ASC`
    - All functions must be async and propagate DB errors to callers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.2 Write property test for create round-trip
    - Mock the DB pool; for any valid `{ ticketId, userId, content }`, `create()` then `findById()` should return a row with matching fields
    - **Property 1: Create round-trip**
    - **Validates: Requirements 2.1**

  - [ ]* 2.3 Write property test for findByTicketId filter and ordering
    - Mock pool with comments for multiple ticketIds; assert every returned row has the correct `ticket_id` and `created_at` values are non-decreasing
    - **Property 2: findByTicketId filter and ordering**
    - **Validates: Requirements 2.2**

  - [ ]* 2.4 Write property test for deleteById round-trip
    - Create comment → deleteById → findById → assert null and affectedRows === 1
    - **Property 3: deleteById round-trip**
    - **Validates: Requirements 2.4**

- [x] 3. Checkpoint — ensure all model tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the Comment controller
  - [x] 4.1 Create `backend/controllers/commentController.js` with `addComment` handler
    - Validate `content` present and non-empty (reject whitespace-only) → 400 `"Content is required"`
    - Call `ticketModel.findById(req.params.ticketId)` → 404 `"Ticket not found"` if null
    - Call `commentModel.create({ ticketId, userId: req.user.id, content })`; return 201 with the full comment row
    - Forward unexpected errors via `next(err)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test: add comment sets correct foreign keys
    - For any valid content and authenticated user, the created comment's `ticket_id` and `user_id` must match the route param and `req.user.id`
    - **Property 4: Add comment sets correct foreign keys**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 4.3 Write property test: add comment rejects empty content
    - Generate whitespace-only strings; assert POST returns 400 with `"Content is required"` and no comment is inserted
    - **Property 5: Add comment rejects empty content**
    - **Validates: Requirements 3.3**

  - [x] 4.4 Add `getComments` handler to `commentController.js`
    - Call `ticketModel.findById(req.params.ticketId)` → 404 if null
    - If `req.user.role !== 'admin'` and `ticket.user_id !== req.user.id` → 403 `"Forbidden"`
    - Call `commentModel.findByTicketId(ticketId)`; return 200 with the array
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.5 Write property test: get comments ownership enforcement
    - For any user and ticket owned by a different user, GET returns 403
    - **Property 6: Get comments ownership enforcement**
    - **Validates: Requirements 4.3**

  - [x] 4.6 Add `deleteComment` handler to `commentController.js`
    - Call `commentModel.findById(req.params.id)` → 404 `"Comment not found"` if null
    - Call `commentModel.deleteById(id)`; return 200 `{ message: "Comment deleted successfully" }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.7 Write property test: delete comment round-trip
    - Admin DELETE on existing comment returns 200; subsequent GET for the ticket's comments does not include that comment
    - **Property 7: Delete comment round-trip**
    - **Validates: Requirements 5.1, 5.2**

- [x] 5. Checkpoint — ensure all controller tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create comment routes and wire into server
  - [x] 6.1 Create `backend/routes/commentRoutes.js`
    - Use `express.Router({ mergeParams: true })` so nested `:ticketId` param is accessible
    - Mount `POST /` and `GET /` with `authenticate` guard invoking `addComment` and `getComments`
    - Mount `DELETE /:id` with `authenticate` and `requireRole('admin')` invoking `deleteComment`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Nest comment router inside ticket router
    - In `backend/routes/ticketRoutes.js`, add `router.use('/:ticketId/comments', commentRoutes)` after existing ticket routes
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 6.3 Register standalone comment route in `backend/server.js`
    - Verify or add `app.use('/api/comments', commentRoutes)` for the DELETE endpoint
    - _Requirements: 6.3, 6.5_

- [x] 7. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in `devDependencies`) with a minimum of 100 iterations each
- Tag each property test with: `// Feature: comment-management, Property N: <property text>`
- `commentModel` must require `ticketModel` only in the controller — keep the model layer free of cross-model dependencies
- The `mergeParams: true` option on the comment router is required for `req.params.ticketId` to be populated when nested under `ticketRoutes.js`
