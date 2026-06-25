# Requirements Document

## Introduction

This document specifies four enhancements to the existing IT Helpdesk Ticketing System: email notifications on ticket status changes, search and filter capabilities for ticket listings, pagination of ticket results, and the ability to assign tickets to specific users. The backend is built with Node.js, Express, and MySQL; the frontend uses React.

## Glossary

- **EmailService**: The backend service responsible for composing and sending email notifications via SMTP.
- **Ticket**: A support request record stored in the `tickets` table with fields: id, title, description, status, priority, user_id, assigned_to, created_at, updated_at.
- **Filter**: A set of optional query parameters (search, status, priority) used to narrow down ticket results.
- **Pagination**: The mechanism for splitting a large list of tickets into fixed-size pages returned with metadata.
- **Assignee**: The user to whom a ticket has been assigned, referenced by assigned_to in the tickets table.
- **Admin**: A user with role = 'admin' who has elevated permissions.
- **TicketController**: The Express controller at backend/controllers/ticketController.js handling ticket HTTP routes.
- **TicketModel**: The data-access layer at backend/models/ticketModel.js for ticket database operations.
- **UserModel**: The data-access layer at backend/models/userModel.js for user database operations.

---

## Requirements

### Requirement 1: Email Notification on Status Change

**User Story:** As a ticket owner, I want to receive an email when my ticket status is updated, so that I am immediately informed of progress without having to check the system.

#### Acceptance Criteria

1. THE EmailService SHALL expose a `sendStatusChangeEmail(userEmail, ticketTitle, newStatus)` function that sends an email via SMTP.
2. WHEN an admin updates a ticket's status via `PUT /api/tickets/:id`, THE TicketController SHALL retrieve the ticket owner's email using UserModel and call EmailService.sendStatusChangeEmail.
3. WHEN the SMTP configuration is valid and the email is sent successfully, THE EmailService SHALL resolve without error.
4. IF the SMTP configuration is missing or invalid, THEN THE EmailService SHALL throw a descriptive error without crashing the server.
5. IF sending the email fails after ticket update, THEN THE TicketController SHALL log the error and still return the updated ticket to the caller with HTTP 200.
6. THE EmailService SHALL read SMTP configuration from environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.
7. WHEN a status change email is sent, THE EmailService SHALL include the ticket title and new status in the email body.

---

### Requirement 2: Search and Filter Tickets

**User Story:** As a user or admin, I want to search and filter the ticket list by keyword, status, and priority, so that I can quickly locate relevant tickets.

#### Acceptance Criteria

1. WHEN `GET /api/tickets` is called with a `search` query parameter, THE TicketController SHALL return only tickets whose title contains the search string (case-insensitive).
2. WHEN `GET /api/tickets` is called with a `status` query parameter, THE TicketController SHALL return only tickets matching that status value.
3. WHEN `GET /api/tickets` is called with a `priority` query parameter, THE TicketController SHALL return only tickets matching that priority value.
4. WHEN multiple filter parameters are provided simultaneously, THE TicketController SHALL apply all filters conjunctively (AND logic).
5. WHEN no filter parameters are provided, THE TicketController SHALL return all tickets accessible to the caller (unfiltered behaviour unchanged).
6. THE TicketModel SHALL accept a `{ search, status, priority }` filter object in `findAll()` and `findByUserId()` and build a dynamic parameterised SQL WHERE clause.
7. IF an unknown or invalid status or priority value is supplied, THEN THE TicketController SHALL return HTTP 400 with a descriptive error message.
8. THE Dashboard component SHALL render a text input for keyword search and dropdown selectors for status and priority filters.
9. WHEN a user changes a filter value on the Dashboard, THE Dashboard component SHALL re-fetch tickets with the updated query parameters.

---

### Requirement 3: Pagination

**User Story:** As a user or admin, I want ticket results returned in pages, so that large volumes of tickets do not degrade performance or usability.

#### Acceptance Criteria

1. WHEN `GET /api/tickets` is called with a `page` query parameter, THE TicketController SHALL return tickets for the requested page (1-indexed).
2. WHEN `GET /api/tickets` is called with a `limit` query parameter, THE TicketController SHALL restrict the page size to that number of records.
3. WHEN `page` or `limit` are omitted, THE TicketController SHALL apply defaults of `page=1` and `limit=10`.
4. THE TicketController SHALL return a JSON response of the shape `{ data: [...], total, page, limit, totalPages }` instead of a plain array.
5. THE TicketModel SHALL accept `{ page, limit }` pagination options in `findAll()` and `findByUserId()` and apply SQL `LIMIT` and `OFFSET` accordingly.
6. THE TicketModel SHALL return the total count of matching records (after filters are applied) alongside the paginated rows.
7. IF `page` or `limit` contain non-integer or negative values, THEN THE TicketController SHALL return HTTP 400 with a descriptive error message.
8. THE Dashboard component SHALL display pagination controls including a previous button, next button, and current page indicator.
9. WHEN the user clicks a pagination control, THE Dashboard component SHALL fetch the corresponding page and update the ticket list.
10. WHILE on the first page, THE Dashboard component SHALL disable the previous button.
11. WHILE on the last page, THE Dashboard component SHALL disable the next button.

---

### Requirement 4: Assign Ticket to User

**User Story:** As an admin, I want to assign a ticket to a specific user, so that responsibility for resolving the ticket is clearly designated.

#### Acceptance Criteria

1. WHEN an admin sends `PUT /api/tickets/:id` with an `assigned_to` field, THE TicketController SHALL update the ticket's assigned_to column to the supplied user id.
2. WHEN a non-admin user sends `PUT /api/tickets/:id` with an `assigned_to` field, THE TicketController SHALL ignore the field and not update assigned_to.
3. WHEN `GET /api/tickets` is called, THE TicketModel SHALL join the users table to include the assignee's name as `assigned_to_name` in each ticket row.
4. WHEN `GET /api/tickets/:id` is called, THE TicketModel SHALL include the assignee's name as `assigned_to_name` in the returned ticket object.
5. IF `assigned_to` is set to a user id that does not exist in the users table, THEN THE TicketController SHALL return HTTP 400 with a descriptive error message.
6. THE TicketDetail component SHALL display an assignee dropdown (populated from the users list) visible only to admins.
7. WHEN an admin selects a user from the assignee dropdown in TicketDetail, THE TicketDetail component SHALL call `PUT /api/tickets/:id` with the selected user id and update the displayed assignee.
8. THE Dashboard component SHALL display the assignee name for each ticket where one is set.
9. THE AdminPanel component SHALL display the assignee name for each ticket in the tickets table.
