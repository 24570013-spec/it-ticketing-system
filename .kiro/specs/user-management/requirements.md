# Requirements Document

## Introduction

This document defines the requirements for the User Management feature of the IT Helpdesk Ticketing System. The feature exposes admin-only endpoints for listing all users, retrieving a single user by ID, updating a user's role, and deleting a user. It extends the existing `userModel.js` with three new data-access methods and introduces a new User controller and User routes module. All endpoints are restricted to users with the `admin` role.

## Glossary

- **User_Model**: The existing data-access module at `backend/models/userModel.js` that executes SQL queries against the `users` table
- **User_Controller**: The new Express controller module at `backend/controllers/userController.js` that handles user management request handlers
- **User_Router**: The Express router at `backend/routes/userRoutes.js` that mounts user management endpoints under `/api/users`
- **Auth_Middleware**: The existing JWT verification middleware exported as `{ authenticate }` from `backend/middleware/authMiddleware.js`
- **Role_Middleware**: The existing role-enforcement factory exported as `{ requireRole }` from `backend/middleware/roleMiddleware.js`
- **DB_Pool**: The shared mysql2 connection pool exported as `{ pool }` from `backend/config/db.js`
- **Requesting_User**: The authenticated user whose decoded JWT payload is attached to `req.user` by Auth_Middleware
- **Role**: A string value assigned to each user; valid values are `'user'` and `'admin'`

---

## Requirements

### Requirement 1: Extended User Model

**User Story:** As a developer, I want the User model to expose additional data-access methods, so that admin controllers can list, update, and delete user records without writing raw SQL inline.

#### Acceptance Criteria

1. THE User_Model SHALL expose a `findAll()` function that returns all rows from the `users` table, ordered by `created_at` ascending, excluding the `password_hash` column from the result
2. THE User_Model SHALL expose an `updateRole(id, role)` function that updates the `role` column of the matching user row and returns the number of affected rows
3. THE User_Model SHALL expose a `deleteById(id)` function that deletes the matching user row and returns the number of affected rows
4. WHEN a database error occurs inside any new User_Model function, THE User_Model SHALL propagate the error to the caller without swallowing it
5. THE User_Model SHALL use the shared DB_Pool from `backend/config/db.js` for all queries

---

### Requirement 2: List Users

**User Story:** As an admin, I want to list all registered users, so that I can see who has access to the ticketing system.

#### Acceptance Criteria

1. WHEN a `GET /api/users` request is received from a Requesting_User with role `'admin'`, THE User_Controller SHALL return HTTP 200 with a JSON array of all user rows, each excluding `password_hash`
2. WHEN the `users` table is empty, THE User_Controller SHALL return HTTP 200 with an empty JSON array
3. THE `GET /api/users` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 3: Get User by ID

**User Story:** As an admin, I want to retrieve a specific user by their ID, so that I can view their account details.

#### Acceptance Criteria

1. WHEN a `GET /api/users/:id` request is received from a Requesting_User with role `'admin'`, THE User_Controller SHALL return HTTP 200 with the matching user object excluding `password_hash`
2. WHEN a `GET /api/users/:id` request is received and no user with the given `id` exists, THE User_Controller SHALL return HTTP 404 with a JSON body `{ "message": "User not found" }`
3. THE `GET /api/users/:id` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 4: Update User Role

**User Story:** As an admin, I want to update a user's role, so that I can grant or revoke admin access to the ticketing system.

#### Acceptance Criteria

1. WHEN a `PUT /api/users/:id/role` request is received with a valid `role` value, THE User_Controller SHALL update the user's role via the User_Model and return HTTP 200 with the updated user object excluding `password_hash`
2. WHEN a `PUT /api/users/:id/role` request is received with a `role` value not in `['user', 'admin']`, THE User_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Invalid role value" }`
3. WHEN a `PUT /api/users/:id/role` request is received and no user with the given `id` exists, THE User_Controller SHALL return HTTP 404 with a JSON body `{ "message": "User not found" }`
4. THE `PUT /api/users/:id/role` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 5: Delete User

**User Story:** As an admin, I want to delete a user account, so that I can remove accounts that are no longer needed.

#### Acceptance Criteria

1. WHEN a `DELETE /api/users/:id` request is received from a Requesting_User with role `'admin'`, THE User_Controller SHALL delete the matching user via the User_Model
2. WHEN user deletion succeeds, THE User_Controller SHALL return HTTP 200 with a JSON body `{ "message": "User deleted successfully" }`
3. WHEN a `DELETE /api/users/:id` request is received and no user with the given `id` exists, THE User_Controller SHALL return HTTP 404 with a JSON body `{ "message": "User not found" }`
4. THE `DELETE /api/users/:id` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 6: User Management Routes

**User Story:** As a developer, I want user management endpoints wired into the Express router, so that all admin user operations are accessible via the API.

#### Acceptance Criteria

1. THE User_Router SHALL mount `GET /api/users` invoking the list handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
2. THE User_Router SHALL mount `GET /api/users/:id` invoking the get-by-id handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
3. THE User_Router SHALL mount `PUT /api/users/:id/role` invoking the update-role handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
4. THE User_Router SHALL mount `DELETE /api/users/:id` invoking the delete handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
5. THE User_Router SHALL be registered in `backend/server.js` under the `/api/users` prefix
