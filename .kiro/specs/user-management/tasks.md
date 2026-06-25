# Implementation Plan: User Management

## Overview

Implement admin-only user management endpoints by extending the existing `userModel.js` and adding a new controller and routes module. Tasks follow dependency order: model extensions → controller → routes → wiring.

## Tasks

- [x] 1. Extend the User model
  - [x] 1.1 Add `findAll`, `updateRole`, and `deleteById` to `backend/models/userModel.js`
    - `findAll()` selects `id, name, email, role, created_at` (no `password_hash`), ordered by `created_at ASC`
    - `updateRole(id, role)` updates the `role` column and returns `affectedRows`
    - `deleteById(id)` deletes the row and returns `affectedRows`
    - All three functions must be async and propagate DB errors to callers
    - Export all three alongside the existing `findByEmail`, `createUser`, `findById`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property test: password_hash never exposed
    - For any set of generated users, `findAll()` must return rows with no `password_hash` key
    - **Property 1: password_hash is never exposed**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1**

  - [ ]* 1.3 Write property test: updateRole round-trip (model)
    - Mock pool; for any valid role value, `updateRole()` then `findById()` should reflect the new role with other fields unchanged
    - **Property 2: updateRole round-trip (model)**
    - **Validates: Requirements 1.2**

  - [ ]* 1.4 Write property test: deleteById round-trip (model)
    - Mock pool; `deleteById()` returns affectedRows 1; subsequent `findById()` returns null
    - **Property 3: deleteById round-trip (model)**
    - **Validates: Requirements 1.3**

- [x] 2. Checkpoint — ensure all model tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement the User controller
  - [x] 3.1 Create `backend/controllers/userController.js` with `getUsers` and `getUserById` handlers
    - `getUsers`: call `userModel.findAll()`; return 200 with the array
    - `getUserById`: call `userModel.findById(id)`; 404 `"User not found"` if null; strip `password_hash` before responding; return 200
    - Forward unexpected errors via `next(err)`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [x] 3.2 Add `updateUserRole` handler to `userController.js`
    - Validate `role` in `['user', 'admin']` → 400 `"Invalid role value"` if not
    - Call `userModel.findById(id)` → 404 `"User not found"` if null
    - Call `userModel.updateRole(id, role)`
    - Fetch updated user via `userModel.findById(id)`, strip `password_hash`, return 200
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.3 Write property test: invalid role value rejected
    - Generate strings not in `['user','admin']`; assert PUT returns 400 and role is unchanged
    - **Property 5: Invalid role value rejected**
    - **Validates: Requirements 4.2**

  - [ ]* 3.4 Write property test: update role round-trip (HTTP)
    - For any valid role value, PUT then GET should return a user with the updated role and no password_hash
    - **Property 4: Update role round-trip (HTTP)**
    - **Validates: Requirements 4.1**

  - [x] 3.5 Add `deleteUser` handler to `userController.js`
    - Call `userModel.findById(id)` → 404 `"User not found"` if null
    - Call `userModel.deleteById(id)`; return 200 `{ message: "User deleted successfully" }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.6 Write property test: delete user round-trip (HTTP)
    - Create user → admin DELETE → GET → assert 404
    - **Property 6: Delete user round-trip (HTTP)**
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. Checkpoint — ensure all controller tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create user routes and wire into server
  - [x] 5.1 Create `backend/routes/userRoutes.js`
    - Import `{ authenticate }` and `{ requireRole }` from existing middleware modules
    - Define `adminOnly = [authenticate, requireRole('admin')]`
    - Mount `GET /`, `GET /:id`, `PUT /:id/role`, `DELETE /:id` each guarded by `adminOnly`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.2 Register user routes in `backend/server.js`
    - Verify `app.use('/api/users', userRoutes)` is present (already stubbed in server.js)
    - _Requirements: 6.5_

- [x] 6. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in `devDependencies`) with a minimum of 100 iterations each
- Tag each property test with: `// Feature: user-management, Property N: <property text>`
- The `password_hash` field must be stripped in the controller for `findById`-based responses (GET by id, update role) — `findAll` handles exclusion at the SQL level
- `userRoutes.js` is already imported in `server.js` — just ensure the file exists and exports the router
