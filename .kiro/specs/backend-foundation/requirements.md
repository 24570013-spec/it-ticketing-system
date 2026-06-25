# Requirements Document

## Introduction

This document defines the requirements for the backend foundation of the IT Helpdesk Ticketing System. The foundation covers three core concerns: the Express server setup (middleware, routing, error handling), the MySQL database connection layer, and the environment configuration. This foundation must be stable, secure, and extensible enough to support all future features including authentication, ticket management, user management, and comments.

## Glossary

- **Server**: The Express.js HTTP server that handles all incoming API requests
- **DB_Pool**: The MySQL2 connection pool that manages database connections
- **Middleware**: Express middleware functions that process requests before they reach route handlers
- **Router**: An Express Router instance that groups related route handlers
- **JWT_Secret**: The secret key used to sign and verify JSON Web Tokens
- **Environment**: Runtime configuration values loaded from the `.env` file via `dotenv`
- **Error_Handler**: The centralized Express error-handling middleware that formats and returns error responses

---

## Requirements

### Requirement 1: Environment Configuration

**User Story:** As a developer, I want all sensitive configuration values loaded from environment variables, so that secrets are never hardcoded and the application can be configured per environment.

#### Acceptance Criteria

1. THE Server SHALL load environment variables from a `.env` file at startup using `dotenv`
2. THE Server SHALL require the following variables to be defined: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, and `PORT`
3. IF any required environment variable is missing at startup, THEN THE Server SHALL log a descriptive error message and exit the process with a non-zero exit code
4. THE `.env` file SHALL define default-safe values for `PORT` (3000) and `DB_PORT` (3306) when not otherwise specified

---

### Requirement 2: MySQL Database Connection

**User Story:** As a developer, I want a managed MySQL connection pool, so that the application can efficiently handle concurrent database queries without exhausting connections.

#### Acceptance Criteria

1. THE DB_Pool SHALL be created using the `mysql2/promise` library with connection pooling enabled
2. THE DB_Pool SHALL be configured using values from the Environment (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
3. WHEN the application starts, THE DB_Pool SHALL verify connectivity by executing a test query (`SELECT 1`)
4. IF the test query fails, THEN THE Server SHALL log the database error and exit the process with a non-zero exit code
5. THE DB_Pool SHALL expose a single exported instance reusable across all models and controllers
6. THE DB_Pool SHALL be configured with a `waitForConnections` value of `true` and a `connectionLimit` of 10

---

### Requirement 3: Express Server Setup

**User Story:** As a developer, I want a fully configured Express server, so that the application can receive HTTP requests with proper parsing, security headers, and CORS handling.

#### Acceptance Criteria

1. THE Server SHALL initialize an Express application and listen on the port defined by the `PORT` environment variable
2. THE Server SHALL apply `express.json()` middleware to parse JSON request bodies
3. THE Server SHALL apply `express.urlencoded({ extended: true })` middleware to parse URL-encoded request bodies
4. THE Server SHALL apply `cors` middleware to allow cross-origin requests from the configured frontend origin
5. WHEN the server starts successfully, THE Server SHALL log the port number it is listening on
6. THE Server SHALL mount a health-check route at `GET /api/health` that returns HTTP 200 with a JSON body `{ "status": "ok" }`

---

### Requirement 4: Route Registration

**User Story:** As a developer, I want all API routes registered under a versioned `/api` prefix, so that the API surface is organized and future versioning is straightforward.

#### Acceptance Criteria

1. THE Server SHALL register an auth router at the path `/api/auth`
2. THE Server SHALL register a tickets router at the path `/api/tickets`
3. THE Server SHALL register a users router at the path `/api/users`
4. THE Server SHALL register a comments router at the path `/api/comments`
5. WHEN a request is made to an unregistered route, THE Server SHALL return HTTP 404 with a JSON body `{ "message": "Route not found" }`

---

### Requirement 5: Centralized Error Handling

**User Story:** As a developer, I want a centralized error handler, so that all unhandled errors produce consistent, structured JSON responses without leaking stack traces to clients.

#### Acceptance Criteria

1. THE Error_Handler SHALL be registered as the last middleware in the Express application
2. WHEN an error is passed to `next(err)`, THE Error_Handler SHALL return a JSON response with `{ "message": <error message> }` and the HTTP status code from `err.status` or `err.statusCode`, defaulting to 500
3. IF the application is running in a non-production environment, THEN THE Error_Handler SHALL include the `stack` field in the response body for debugging
4. THE Error_Handler SHALL log every error to the console regardless of environment
5. WHEN an unhandled promise rejection occurs at the process level, THE Server SHALL log the rejection reason and exit gracefully
