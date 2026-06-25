# Requirements Document

## Introduction

This document defines the requirements for the Comment Management feature of the IT Helpdesk Ticketing System. The feature allows authenticated users to add comments to tickets, retrieve comments on tickets they own, and allows admins to delete any comment. It introduces the `comments` table, a Comment model, a Comment controller, and comment routes that are partially nested under the existing ticket routes.

## Glossary

- **Comment_Model**: The data-access module that executes SQL queries against the `comments` table
- **Comment_Controller**: The Express controller module that handles comment request handlers
- **Comment_Router**: The Express router that mounts comment endpoints
- **Auth_Middleware**: The existing JWT verification middleware exported as `{ authenticate }` from `backend/middleware/authMiddleware.js`
- **Role_Middleware**: The existing role-enforcement factory exported as `{ requireRole }` from `backend/middleware/roleMiddleware.js`
- **DB_Pool**: The shared mysql2 connection pool exported as `{ pool }` from `backend/config/db.js`
- **Requesting_User**: The authenticated user whose decoded JWT payload is attached to `req.user` by Auth_Middleware
- **Comment_Owner**: The user who authored a comment, identified by the `user_id` column on the `comments` table
- **Ticket_Owner**: The user who created the ticket a comment belongs to, identified by the `user_id` column on the `tickets` table

---

## Requirements

### Requirement 1: Comments Table Schema

**User Story:** As a database administrator, I want a well-defined `comments` table, so that comment records are stored with consistent structure and referential integrity.

#### Acceptance Criteria

1. THE Comment_Model SHALL operate against a `comments` table with the following columns: `id` (unsigned INT, auto-increment, primary key), `ticket_id` (unsigned INT, not null, foreign key referencing `tickets.id`), `user_id` (unsigned INT, not null, foreign key referencing `users.id`), `content` (TEXT, not null), `created_at` (DATETIME, not null, default `CURRENT_TIMESTAMP`)
2. THE `comments` table SHALL enforce a foreign key constraint on `ticket_id` referencing `tickets(id)`
3. THE `comments` table SHALL enforce a foreign key constraint on `user_id` referencing `users(id)`

---

### Requirement 2: Comment Model

**User Story:** As a developer, I want a Comment model with data-access methods, so that controllers can query and persist comment records without writing raw SQL inline.

#### Acceptance Criteria

1. THE Comment_Model SHALL expose a `create({ ticketId, userId, content })` function that inserts a new comment row and returns the newly created comment row (full SELECT after INSERT)
2. THE Comment_Model SHALL expose a `findByTicketId(ticketId)` function that returns all comment rows for the given `ticket_id`, ordered by `created_at` ascending
3. THE Comment_Model SHALL expose a `findById(id)` function that returns the matching comment row or `null` when no row exists
4. THE Comment_Model SHALL expose a `deleteById(id)` function that deletes the matching row and returns the number of affected rows
5. WHEN a database error occurs inside any Comment_Model function, THE Comment_Model SHALL propagate the error to the caller without swallowing it
6. THE Comment_Model SHALL use the shared DB_Pool from `backend/config/db.js` for all queries

---

### Requirement 3: Add Comment

**User Story:** As an authenticated user, I want to add a comment to a ticket, so that I can communicate updates or questions about a support request.

#### Acceptance Criteria

1. WHEN a `POST /api/tickets/:ticketId/comments` request is received with a valid `content` field, THE Comment_Controller SHALL insert a new comment via the Comment_Model with `ticket_id` set to `:ticketId` and `user_id` set to the Requesting_User's `id`
2. WHEN comment creation succeeds, THE Comment_Controller SHALL return HTTP 201 with a JSON body containing the created comment object including `id`, `ticket_id`, `user_id`, `content`, and `created_at`
3. WHEN a `POST /api/tickets/:ticketId/comments` request is received with a missing or empty `content` field, THE Comment_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Content is required" }`
4. WHEN a `POST /api/tickets/:ticketId/comments` request is received and no ticket with `:ticketId` exists, THE Comment_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Ticket not found" }`
5. THE `POST /api/tickets/:ticketId/comments` route SHALL require authentication via Auth_Middleware

---

### Requirement 4: Get Comments for Ticket

**User Story:** As a user or admin, I want to retrieve all comments on a ticket, so that I can read the full discussion thread for a support request.

#### Acceptance Criteria

1. WHEN a `GET /api/tickets/:ticketId/comments` request is received from a Requesting_User with role `'admin'`, THE Comment_Controller SHALL return HTTP 200 with a JSON array of all comment rows for that ticket
2. WHEN a `GET /api/tickets/:ticketId/comments` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` equals the Requesting_User's `id`, THE Comment_Controller SHALL return HTTP 200 with a JSON array of all comment rows for that ticket
3. WHEN a `GET /api/tickets/:ticketId/comments` request is received from a Requesting_User with role `'user'` and the ticket's `user_id` does not equal the Requesting_User's `id`, THE Comment_Controller SHALL return HTTP 403 with a JSON body `{ "message": "Forbidden" }`
4. WHEN a `GET /api/tickets/:ticketId/comments` request is received and no ticket with `:ticketId` exists, THE Comment_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Ticket not found" }`
5. THE `GET /api/tickets/:ticketId/comments` route SHALL require authentication via Auth_Middleware

---

### Requirement 5: Delete Comment

**User Story:** As an admin, I want to delete any comment, so that I can remove inappropriate or incorrect content from the ticketing system.

#### Acceptance Criteria

1. WHEN a `DELETE /api/comments/:id` request is received from a Requesting_User with role `'admin'`, THE Comment_Controller SHALL delete the matching comment via the Comment_Model
2. WHEN comment deletion succeeds, THE Comment_Controller SHALL return HTTP 200 with a JSON body `{ "message": "Comment deleted successfully" }`
3. WHEN a `DELETE /api/comments/:id` request is received and no comment with the given `id` exists, THE Comment_Controller SHALL return HTTP 404 with a JSON body `{ "message": "Comment not found" }`
4. THE `DELETE /api/comments/:id` route SHALL require authentication via Auth_Middleware and SHALL be restricted to Requesting_Users with role `'admin'` via Role_Middleware

---

### Requirement 6: Comment Routes

**User Story:** As a developer, I want comment endpoints wired into the Express router, so that all comment operations are accessible via the API.

#### Acceptance Criteria

1. THE Comment_Router SHALL mount `POST /api/tickets/:ticketId/comments` invoking the add-comment handler, protected by Auth_Middleware
2. THE Comment_Router SHALL mount `GET /api/tickets/:ticketId/comments` invoking the get-comments handler, protected by Auth_Middleware
3. THE Comment_Router SHALL mount `DELETE /api/comments/:id` invoking the delete-comment handler, protected by Auth_Middleware and Role_Middleware with role `'admin'`
4. THE `POST` and `GET` comment routes SHALL be registered in `backend/server.js` under the `/api/tickets` prefix using Express merge params, or as a standalone `/api/tickets/:ticketId/comments` mount
5. THE `DELETE` comment route SHALL be registered in `backend/server.js` under the `/api/comments` prefix
