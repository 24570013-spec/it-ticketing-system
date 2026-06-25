# Implementation Plan: Ticket Enhancements

## Overview

Implement four enhancements to the IT Helpdesk Ticketing System: email notifications on status changes, search & filter for ticket listings, pagination of ticket results, and assignment of tickets to users. All backend code is Node.js/Express/MySQL; frontend uses React.

## Tasks

- [x] 1. Implement email notification service
  - [x] 1.1 Create `backend/services/emailService.js` with `sendStatusChangeEmail(userEmail, ticketTitle, newStatus)`
    - Read SMTP config from env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
    - Use nodemailer to send email; subject = `"Ticket status updated: <ticketTitle>"`
    - Throw descriptive error if SMTP config is missing
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7_
  - [x] 1.2 Wire email send into `ticketController.updateTicket`
    - After successful update, if status changed, fetch owner email and call `sendStatusChangeEmail`
    - Wrap call in `try/catch`; log error but still return HTTP 200 with updated ticket
    - _Requirements: 1.2, 1.5_

- [x] 2. Implement search and filter in Ticket model
  - [x] 2.1 Update `ticketModel.findAll()` to accept `filters = { search, status, priority }`
    - Build dynamic parameterised WHERE clause
    - Include `LEFT JOIN users ON assigned_to` to return `assigned_to_name`
    - Run COUNT sub-query with same WHERE for `total`
    - Return `{ rows, total }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 2.2 Update `ticketModel.findByUserId()` to accept same `filters` and `pagination`
    - Same approach as findAll but scoped to `user_id`
    - _Requirements: 2.6_
  - [x] 2.3 Update `ticketModel.findById()` to include `LEFT JOIN` for `assigned_to_name`
    - _Requirements: 4.3, 4.4_

- [x] 3. Implement pagination in Ticket controller
  - [x] 3.1 Update `ticketController.getTickets` to extract and validate `page`, `limit` query params
    - Default: `page=1`, `limit=10`
    - Return HTTP 400 if `page` or `limit` are non-positive or non-numeric
    - _Requirements: 3.1, 3.2, 3.3, 3.7_
  - [x] 3.2 Return paginated response shape `{ data, total, page, limit, totalPages }`
    - Compute `totalPages = Math.ceil(total / limit)`
    - _Requirements: 3.4, 3.5, 3.6_

- [x] 4. Implement search, filter, and enum validation in Ticket controller
  - [x] 4.1 Validate `status` and `priority` query params against allowed enums; return HTTP 400 on mismatch
    - _Requirements: 2.7_
  - [x] 4.2 Pass `filters` and `pagination` objects to `ticketModel.findAll` / `findByUserId`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Implement ticket assignment (admin)
  - [x] 5.1 Update `ticketController.updateTicket` to accept `assigned_to` field for admin users
    - Validate `assigned_to` user exists via `userModel.findById`; return HTTP 400 if not
    - Strip `assigned_to` from payload for non-admin users (silent ignore)
    - Log assignment change to audit log
    - _Requirements: 4.1, 4.2, 4.5_
  - [x] 5.2 `ticketModel.update()` maps `assignedTo` → `assigned_to` in dynamic SET clause
    - _Requirements: 4.1_

- [x] 6. Update Dashboard frontend
  - [x] 6.1 Add search input and status/priority filter dropdowns to `Dashboard.jsx`
    - Re-fetch on filter change; reset page to 1 on filter change
    - _Requirements: 2.8, 2.9_
  - [x] 6.2 Add pagination controls (Previous/Next buttons, page indicator)
    - Disable Previous on page 1; disable Next on last page
    - _Requirements: 3.8, 3.9, 3.10, 3.11_
  - [x] 6.3 Display `assigned_to_name` in each `TicketCard` when set
    - _Requirements: 4.8_

- [x] 7. Update TicketDetail frontend (admin assignment)
  - [x] 7.1 Fetch users list on mount for admin users
    - _Requirements: 4.6_
  - [x] 7.2 Render assignee dropdown (admin only); on change call `updateTicket` with `assigned_to`
    - _Requirements: 4.6, 4.7_
  - [x] 7.3 Display current `assigned_to_name` or "Unassigned"
    - _Requirements: 4.7_

- [x] 8. Update AdminPanel frontend
  - [x] 8.1 Add "Assignee" column to tickets table; render `assigned_to_name ?? '—'`
    - _Requirements: 4.9_

- [x] 9. Add SLA tracking
  - [x] 9.1 Create `backend/services/slaService.js` with `getSlaDeadline(priority)` and `getSlaStatus(ticket)`
    - Read SLA rules from `sla_rules` table
    - Return `{ status: 'ok'|'warning'|'breached', deadline, hoursRemaining }`
    - _Requirements: (enhancement)_
  - [x] 9.2 Set `sla_deadline` on ticket creation in `ticketController.createTicket`
  - [x] 9.3 Attach `sla` status object to `getTicketById` response

- [x] 10. Add audit log
  - [x] 10.1 Create `backend/services/auditService.js` with `logTicketAction` and `getTicketAuditLog`
    - _Requirements: (enhancement)_
  - [x] 10.2 Log `created`, `status_changed`, `assigned`, `deleted` events in ticketController
  - [x] 10.3 Add `GET /api/tickets/:id/audit` route

- [x] 11. Add in-app notifications
  - [x] 11.1 Create `backend/services/notificationService.js`
    - `createNotification`, `getUserNotifications`, `markAsRead`, `markAllAsRead`
  - [x] 11.2 Create `backend/controllers/notificationController.js`
    - `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
  - [x] 11.3 Create `backend/routes/notificationRoutes.js` and mount in `server.js`
  - [x] 11.4 Create status-change notification in `ticketController.updateTicket`

- [x] 12. Add file attachment support
  - [x] 12.1 Create `backend/middleware/uploadMiddleware.js` using multer
    - Allowed types: jpeg, jpg, png, gif, pdf, doc, docx, txt, zip; max 5MB
  - [x] 12.2 Create `backend/controllers/attachmentController.js`
    - `uploadAttachment`, `getAttachments`, `deleteAttachment`
  - [x] 12.3 Mount attachment routes in `ticketRoutes.js`
    - `POST /:id/attachments`, `GET /:id/attachments`, `DELETE /:id/attachments/:attachId`
  - [x] 12.4 Serve uploaded files statically via `app.use('/uploads', express.static(...))`

- [x] 13. Add admin dashboard stats
  - [x] 13.1 Create `backend/controllers/dashboardController.js` with `getStats`
    - Return counts by status, avg resolution hours, SLA breached count, by-priority breakdown
  - [x] 13.2 Create `backend/routes/dashboardRoutes.js` and mount in `server.js`

- [x] 14. Add refresh token auth
  - [x] 14.1 Create `backend/db/migrations/004_create_refresh_tokens_table.sql`
  - [x] 14.2 Add `POST /api/auth/refresh` and `POST /api/auth/logout` endpoints
  - [x] 14.3 Update `AuthContext.jsx` to handle token refresh on 401 responses

- [x] 15. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, confirm implementation is complete.

## Notes

- Tasks marked with `*` are optional property-based tests
- All required tasks are complete — this spec documents the full implemented state
- Property tests for ticket enhancements can be added as follow-up work
