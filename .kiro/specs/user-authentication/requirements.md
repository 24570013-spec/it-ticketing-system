# Requirements Document

## Introduction

This document defines the requirements for the User Authentication feature of the IT Helpdesk Ticketing System. The feature covers user registration, login, JWT-based session management, and role-based access control. It introduces the `users` table, a User model, an Auth controller, auth routes, a JWT verification middleware, and a role-enforcement middleware. All components integrate with the existing Express + MySQL foundation.

## Glossary

- **Auth_Controller**: The Express controller module that handles registration and login requests
- **Auth_Middleware**: The Express middleware that verifies a JWT on protected routes and attaches the decoded user to the request
- **Role_Middleware**: The Express middleware that enforces role-based access control on protected routes
- **User_Model**: The data-access module that executes SQL queries against the `users` table
- **JWT**: JSON Web Token — a signed, compact token used to represent an authenticated session
- **JWT_Secret**: The secret key loaded from `JWT_SECRET` environment variable, used to sign and verify JWTs
- **Password_Hash**: A bcrypt-hashed representation of a user's plaintext password, stored in the database
- **Role**: A string value assigned to each user that determines their access level; valid values are `user` and `admin`
- **Payload**: The decoded data embedded in a JWT, containing at minimum `id`, `email`, and `role`

---

## Requirements

### Requirement 1: Users Table Schema

**User Story:** As a database administrator, I want a well-defined `users` table, so that user records are stored with consistent structure and constraints.

#### Acceptance Criteria

1. THE User_Model SHALL operate against a `users` table with the following columns: `id` (unsigned INT, auto-increment, primary key), `name` (VARCHAR 100, not null), `email` (VARCHAR 255, not null, unique), `password_hash` (VARCHAR 255, not null), `role` (ENUM `'user'`, `'admin'`, not null, default `'user'`), `created_at` (DATETIME, not null, default `CURRENT_TIMESTAMP`)
2. THE `users` table SHALL enforce a unique constraint on the `email` column
3. THE `users` table SHALL default the `role` column to `'user'` when no role is provided at insert time

---

### Requirement 2: User Model

**User Story:** As a developer, I want a User model with data-access methods, so that controllers can query and persist user records without writing raw SQL inline.

#### Acceptance Criteria

1. THE User_Model SHALL expose a `findByEmail(email)` function that returns the matching user row or `null` when no row exists
2. THE User_Model SHALL expose a `createUser({ name, email, passwordHash, role })` function that inserts a new row and returns the newly created user's `id`
3. THE User_Model SHALL expose a `findById(id)` function that returns the matching user row or `null` when no row exists
4. WHEN a database error occurs inside any User_Model function, THE User_Model SHALL propagate the error to the caller without swallowing it
5. THE User_Model SHALL use the shared `DB_Pool` from `backend/config/db.js` for all queries

---

### Requirement 3: User Registration

**User Story:** As a new user, I want to register with my name, email, and password, so that I can access the ticketing system.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/register` request is received with a valid `name`, `email`, and `password`, THE Auth_Controller SHALL hash the password using bcrypt and insert a new user record via the User_Model
2. WHEN registration succeeds, THE Auth_Controller SHALL return HTTP 201 with a JSON body containing `{ "token": "<jwt>", "user": { "id", "name", "email", "role" } }`
3. WHEN a `POST /api/auth/register` request is received with a missing `name`, `email`, or `password`, THE Auth_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Name, email, and password are required" }`
4. WHEN a `POST /api/auth/register` request is received with an `email` that already exists in the database, THE Auth_Controller SHALL return HTTP 409 with a JSON body `{ "message": "Email already registered" }`
5. THE Auth_Controller SHALL NOT store the plaintext password at any point; only the Password_Hash SHALL be persisted
6. WHEN registration succeeds, THE Auth_Controller SHALL sign a JWT containing `{ id, email, role }` using the JWT_Secret with an expiry of `7d`

---

### Requirement 4: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I receive a JWT to authenticate subsequent requests.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/login` request is received with a valid `email` and `password`, THE Auth_Controller SHALL look up the user by email via the User_Model and compare the provided password against the stored Password_Hash using bcrypt
2. WHEN login succeeds, THE Auth_Controller SHALL return HTTP 200 with a JSON body containing `{ "token": "<jwt>", "user": { "id", "name", "email", "role" } }`
3. WHEN a `POST /api/auth/login` request is received with a missing `email` or `password`, THE Auth_Controller SHALL return HTTP 400 with a JSON body `{ "message": "Email and password are required" }`
4. WHEN the provided `email` does not match any user record, THE Auth_Controller SHALL return HTTP 401 with a JSON body `{ "message": "Invalid credentials" }`
5. WHEN the provided `password` does not match the stored Password_Hash, THE Auth_Controller SHALL return HTTP 401 with a JSON body `{ "message": "Invalid credentials" }`
6. WHEN login succeeds, THE Auth_Controller SHALL sign a JWT containing `{ id, email, role }` using the JWT_Secret with an expiry of `7d`

---

### Requirement 5: JWT Authentication Middleware

**User Story:** As a developer, I want a reusable JWT middleware, so that protected routes can verify the caller's identity without duplicating token-verification logic.

#### Acceptance Criteria

1. WHEN a request arrives at a protected route, THE Auth_Middleware SHALL extract the JWT from the `Authorization` header using the `Bearer <token>` scheme
2. WHEN a valid JWT is present, THE Auth_Middleware SHALL verify it using the JWT_Secret, attach the decoded Payload to `req.user`, and call `next()`
3. WHEN the `Authorization` header is absent or does not use the `Bearer` scheme, THE Auth_Middleware SHALL return HTTP 401 with a JSON body `{ "message": "No token provided" }`
4. WHEN the JWT is present but invalid or expired, THE Auth_Middleware SHALL return HTTP 401 with a JSON body `{ "message": "Invalid or expired token" }`
5. THE Auth_Middleware SHALL NOT modify the request if the token is invalid; it SHALL only call `next()` when the token is successfully verified

---

### Requirement 6: Role-Based Access Control Middleware

**User Story:** As a system administrator, I want role-based access control, so that certain routes are restricted to users with the appropriate role.

#### Acceptance Criteria

1. THE Role_Middleware SHALL be a factory function `requireRole(...roles)` that returns an Express middleware function
2. WHEN a request reaches a role-protected route and `req.user.role` is included in the allowed `roles` array, THE Role_Middleware SHALL call `next()` to allow the request to proceed
3. WHEN a request reaches a role-protected route and `req.user.role` is NOT included in the allowed `roles` array, THE Role_Middleware SHALL return HTTP 403 with a JSON body `{ "message": "Forbidden" }`
4. THE Role_Middleware SHALL always be applied after THE Auth_Middleware on any protected route, so that `req.user` is guaranteed to be populated

---

### Requirement 7: Auth Routes

**User Story:** As a developer, I want the auth endpoints wired into the Express router, so that registration and login are accessible via the API.

#### Acceptance Criteria

1. THE Auth_Controller SHALL be mounted such that `POST /api/auth/register` invokes the registration handler
2. THE Auth_Controller SHALL be mounted such that `POST /api/auth/login` invokes the login handler
3. THE Auth_Controller SHALL update the existing stub router in `backend/routes/authRoutes.js` rather than creating a new file
