# Requirements Document

## Introduction

This document defines the requirements for the Ticket Management feature of the IT Helpdesk Ticketing System. The feature covers the full CRUD lifecycle for support tickets: creation, retrieval, update, and deletion. It introduces the `tickets` table, a Ticket model, a Ticket controller, and protected ticket routes. Role-based access control ensures regular users can only manage their own tickets while admins can view and update all tickets.

## Glossary

- **Ticket_Model**: The data-access module that executes SQL queries against the `tickets` table
- **Ticket_Controller**: The Express controller module that handles ticket CRUD request handlers
- **Ticket_Router**: The Express router that mounts ticket endpoints under `/api/tickets`
- **Auth_Middleware**: The existing JWT verification middleware exported as `{ authenticate }` from `backend/middleware/authMiddleware.js`
- **Role_Middleware**: The existing role-enforcement factory exported as `{ requireRole }` from `backend/middleware/roleMiddleware.js`
- **DB_Pool**: The shared mysql2 connection pool exported as `{ pool }` from `backend/config/db.js`
- **Requesting_User**: The authenticated user whose decoded JWT payload is attached to `req.user` by Auth_Middleware
- **Status**: A string enumeration representing the current state of a ticket; valid values are `'open'`, `'in_progress'`, `'resolved'`, `'closed'`
- **Priority**: A string enumeration representing the urgency of a ticket; valid values are `'low'`, `'medium'`, `'high'`
- **Owner**: The user who created a ticket, identified by the `user_id` column

---

## Requirements

### Requirement 1: Tickets Table Schema

**User Story:** As a database administrator, I want a well-defined `tickets` table, so that ticket records are stored with consistent structure and constraints.

#### Acceptance Criteria

1. THE Ticket_Model SHALL operate against a `tickets` table with the following columns: `id` (unsigned INT, auto-increment, primary key), `title` (VARCHAR 255, not null), `description` (TEXT, not null), `status` (ENUM `'open'`, `'in_progress'`, `'resolved'`, `'closed'`, not null, default `'open'`), `priority` (ENUM `'low'`, `'medium'`, `'high'`, not null, default `'medium'`), `user_id` (unsigned INT, not null, foreign key referencing `users.id`), `assigned_to` (unsigned INT, nullable, foreign key referencing `users.id`), `created_at` (DATETIME, not null, default `CURRENT_TIMESTAMP`), `updated_at` (DATETIME, not null, default `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
2. THE `tickets` table SHALL enforce a foreign key constraint on `user_id` referencing `users(id)`
3. THE `tickets` table SHALL default the `status` column to `'open'` when no status is provided at insert time
4. THE `tickets` table SHALL default the `priority` column to `'medium'` when no priority is provided at insert time

---

### Requirement 2: Ticket Model

**User Story:** As a developer, I want a Ticket model with data-access methods, so that controllers can query and persist ticket records without writing raw SQL inline.

#### Acceptance Criteria

1. THE Ticket_Model SHALL expose a `create({ title, description, priority, userId })` function that inserts a new ticket row and returns the newly created ticket's `id`
2. THE Ticket_Model SHALL expose a `findAll()` function that returns all ticket rows ordered by `created_at` descending
3. THE Ticket_Model SHALL expose a `findById(id)` function that returns the matching ticket row or `null` when no row exists
4. THE Ticket_Model SHALL expose a `findByUserId(userId)` function that returns all ticket rows where `user_id` equals `userId`, ordered by `created_at` descending
5. THE Ticket_Model SHALL expose an `updateStatus(id, status)` function that updates the `status` column of the matching row and returns the number of affected rows
6. THE Ticket_Model SHALL expose an `update(id, { title, description, priority, status, assignedTo })` function that updates only the provided fields on the matching row and returns the number of affected rows
7. THE Ticket_Model SHALL expose a `deleteById(id)` function that deletes the matching row and returns the number of affected rows
8. WHEN a database error occurs inside any Ticket_Model function, THE Ticket_Model SHALL propagate the error to the caller without swallowing it
9. THE Ticket_Model SHALL use the shared DB_Pool from `backend/config/db.js` for all queries

---

### Requirement 3: Create Ticket

**User Story:** As a user, I want to create a support ticket, so that I can report an IT issue and track its resolution.

#### Acceptance Criteria

1. WHEN a `POST /api/tickets` request is received with a valid `title` and `description`, THE Ticket_Controller SHALL insert a new ticket via the Ticket_Model with `user_id` set to the Requesting_User's `id`
2. WHEN ticket creation succeeds, THE Ticket_Controller SHALL return HTTP 201 with a JSON body containing the created ticket object including `id`, `title`, `description`, `status`, `priority`, `user_id`, `assigned_to`, `created_at`, and `updated_at`
3. WHEN a `POST /api/tickets` request is received with a missing or empty `title` or `description`, THE Ticket_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Title and description are required" }`
4. WHERE a `priority` field is provided in the request body, THE Ticket_Controller SHALL pass it to the Ticket_Model; otherwise the Ticket_Model default of `'medium'` SHALL apply
5. THE `POST /api/tickets` route SHALL require authentication via Auth_Middleware

---

### Requirement 4: Retrieve Tickets

**User Story:** As a user or admin, I want to retrieve tickets, so that I can view the current state of support requests.

#### Acceptance Criteria

1. WHEN a `GET /api/tickets` request is received from a Requesting_User with role `'admin'`, THE Ticket_Controller SHALL return HTTP 200 with a JSON array of all ticket rows
2. WHEN a `GET /api/tickets` request is received from a Requesting_User with role `'user'`, THE Ticket_Controller SHALL return HTTP 200 with a JSON array containing only the tickets where `user_id` equals the Requesting_User's `id`
3. WHEN a `GET /api/tickets/:id` request is received from a Requesting_User with role `'admin'`, THE Ticket_Controller SHALL return HTTP 200 with the matching ticket object
4. WHEN a `GET /api/tickets/:id` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` equals the Requesting_User's `id`, THE Ticket_Controller SHALL return HTTP 200 with the matching ticket object
5. WHEN a `GET /api/tickets/:id` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` does not equal the Requesting_User's `id`, THE Ticket_Controller SHALL return HTTP 403 with a JSON body `{ "message": "Forbidden" }`
6. WHEN a `GET /api/tickets/:id` request is received and no ticket with the given `id` exists, THE Ticket_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Ticket not found" }`
7. THE `GET /api/tickets` and `GET /api/tickets/:id` routes SHALL require authentication via Auth_Middleware

---

### Requirement 5: Update Ticket

**User Story:** As a user or admin, I want to update a ticket, so that I can change its details or advance its status.

#### Acceptance Criteria

1. WHEN a `PUT /api/tickets/:id` request is received from a Requesting_User with role `'admin'`, THE Ticket_Controller SHALL allow updating any combination of `title`, `description`, `priority`, `status`, and `assigned_to` fields
2. WHEN a `PUT /api/tickets/:id` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` equals the Requesting_User's `id`, THE Ticket_Controller SHALL allow updating `title`, `description`, and `priority` fields only
3. WHEN a `PUT /api/tickets/:id` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` does not equal the Requesting_User's `id`, THE Ticket_Controller SHALL return HTTP 403 with a JSON body `{ "message": "Forbidden" }`
4. WHEN a `PUT /api/tickets/:id` request is received and no ticket with the given `id` exists, THE Ticket_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Ticket not found" }`
5. WHEN a `PUT /api/tickets/:id` request is received with a `status` value not in `['open', 'in_progress', 'resolved', 'closed']`, THE Ticket_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Invalid status value" }`
6. WHEN a `PUT /api/tickets/:id` request is received with a `priority` value not in `['low', 'medium', 'high']`, THE Ticket_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Invalid priority value" }`
7. WHEN a ticket update succeeds, THE Ticket_Controller SHALL return HTTP 200 with the updated ticket object fetched via `findById`
8. THE `PUT /api/tickets/:id` route SHALL require authentication via Auth_Middleware

---

### Requirement 6: Delete Ticket

**User Story:** As an admin, I want to delete a ticket, so that I can remove invalid or duplicate support requests.

#### Acceptance Criteria

1. WHEN a `DELETE /api/tickets/:id` request is received from a Requesting_User with role `'admin'`, THE Ticket_Controller SHALL delete the matching ticket via the Ticket_Model
2. WHEN ticket deletion succeeds, THE Ticket_Controller SHALL return HTTP 200 with a JSON body `{ "message": "Ticket deleted successfully" }`
3. WHEN a `DELETE /api/tickets/:id` request is received and no ticket with the given `id` exists, THE Ticket_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Ticket not found" }`
4. THE `DELETE /api/tickets/:id` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 7: Ticket Routes

**User Story:** As a developer, I want ticket endpoints wired into the Express router, so that all ticket operations are accessible via the API.

#### Acceptance Criteria

1. THE Ticket_Router SHALL mount `POST /api/tickets` invoking the create handler, protected by Auth_Middleware
2. THE Ticket_Router SHALL mount `GET /api/tickets` invoking the list handler, protected by Auth_Middleware
3. THE Ticket_Router SHALL mount `GET /api/tickets/:id` invoking the get-by-id handler, protected by Auth_Middleware
4. THE Ticket_Router SHALL mount `PUT /api/tickets/:id` invoking the update handler, protected by Auth_Middleware
5. THE Ticket_Router SHALL mount `DELETE /api/tickets/:id` invoking the delete handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
6. THE Ticket_Router SHALL be registered in `backend/server.js` under the `/api/tickets` prefix
