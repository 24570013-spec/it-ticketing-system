# Implementation Plan: Frontend Application

## Overview

Implement the React + Vite frontend for the IT Helpdesk Ticketing System. Tasks are ordered so that each step produces working, integrated code — starting with the project scaffold, then the service and auth layers, then shared components, then pages, and finally wiring everything together in the router.

## Tasks

- [x] 1. Scaffold the project: package.json, vite.config.js, index.html, main.jsx
  - Create `frontend/package.json` with `react`, `react-dom`, `react-router-dom`, `axios` as dependencies and `vite`, `@vitejs/plugin-react` as devDependencies; add `dev` and `build` scripts
  - Create `frontend/vite.config.js` configuring `@vitejs/plugin-react` and setting dev server port to `5173`
  - Create `frontend/index.html` with a `<div id="root">` mount point and a `<script type="module" src="/main.jsx">` tag
  - Write `frontend/main.jsx` to call `ReactDOM.createRoot` on `#root` and render `<App />`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement the API service layer
  - [x] 2.1 Write `frontend/services/api.js`
    - Create an axios instance with `baseURL: 'http://localhost:3000'`
    - Add a request interceptor that reads `localStorage.getItem('token')` and sets `Authorization: Bearer <token>` when present
    - Export all endpoint wrapper functions: `loginUser`, `registerUser`, `getTickets`, `getTicketById`, `createTicket`, `updateTicket`, `deleteTicket`, `getComments`, `postComment`, `deleteComment`, `getUsers`, `getUserById`, `updateUserRole`, `deleteUser`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for token injection (Property 1)
    - **Property 1: Token injection invariant**
    - **Validates: Requirements 2.2**
    - For any non-empty token string, assert every request through the instance includes `Authorization: Bearer <token>`

  - [ ]* 2.3 Write property test for error propagation (Property 2)
    - **Property 2: Error propagation**
    - **Validates: Requirements 2.5**
    - For any 4xx/5xx status code, assert the endpoint function rejects rather than resolves

- [x] 3. Implement AuthContext
  - [x] 3.1 Write `frontend/context/AuthContext.jsx`
    - Define `AuthProvider` component with `user` and `token` state
    - On mount, read `localStorage.getItem('token')`; if present, decode the base64 payload via `atob(token.split('.')[1])` and call `setUser(payload)` — no network request
    - Implement `login(email, password)`: call `loginUser`, write token to localStorage, decode payload, update state
    - Implement `register(name, email, password)`: call `registerUser`, write token to localStorage, decode payload, update state
    - Implement `logout()`: call `localStorage.removeItem('token')`, set user and token state to `null`
    - Export `useAuth` convenience hook wrapping `useContext(AuthContext)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 3.2 Write property test for auth round-trip (Property 3)
    - **Property 3: Auth round-trip (login and register)**
    - **Validates: Requirements 3.3, 3.4**
    - For any mock login/register response, assert localStorage and user state match decoded payload

  - [ ]* 3.3 Write property test for logout clears state (Property 4)
    - **Property 4: Logout clears state**
    - **Validates: Requirements 3.5**

  - [ ]* 3.4 Write property test for token hydration on init (Property 5)
    - **Property 5: Token hydration on init**
    - **Validates: Requirements 3.6**

- [x] 4. Implement shared components: StatusBadge, TicketCard, Navbar
  - [x] 4.1 Write `frontend/src/components/StatusBadge.jsx`
    - Accept `status` prop; render a `<span>` with inline styles from a `COLOR_MAP` keyed on status values: blue for `open`, orange for `in_progress`, green for `resolved`, grey for `closed`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 4.2 Write property test for StatusBadge color map (Property 9)
    - **Property 9: StatusBadge renders correct color for every valid status**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

  - [x] 4.3 Write `frontend/src/components/TicketCard.jsx`
    - Accept `ticket` prop; render `title`, `priority`, a `<StatusBadge status={ticket.status} />`, and `created_at` formatted with `new Date(ticket.created_at).toLocaleDateString()`
    - Wrap the card in a clickable element that calls `useNavigate()` to push `/tickets/${ticket.id}` on click
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 4.4 Write property test for TicketCard fields and navigation (Properties 10, 11)
    - **Property 10: TicketCard renders all required ticket fields**
    - **Property 11: TicketCard click navigates to correct route**
    - **Validates: Requirements 9.1, 9.3, 9.4**

  - [x] 4.5 Write `frontend/src/components/Navbar.jsx`
    - Read `user` and `logout` from `useAuth()`; render a Dashboard link, a conditional Admin Panel link when `user.role === 'admin'`, the user's name or email, and a logout button
    - On logout button click: call `logout()` then `navigate('/login')`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 4.6 Write property test for Navbar user display (Property — subset of P8 pattern)
    - For any user object, assert Navbar renders `user.name` or `user.email` and hides the admin link when `role !== 'admin'`
    - **Validates: Requirements 7.2, 7.3, 7.6**

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Login and Register pages
  - [x] 6.1 Write `frontend/pages/Login.jsx`
    - Render a form with email and password inputs and a submit button
    - On submit: validate that both fields are non-empty (show inline error if not, do not call API); call `login()` from `useAuth()`; on success navigate to `/`; on error display `error.response.data.message`
    - Render a link to `/register`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write property test for error message surfacing on Login (Property 8 — Login)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 5.3**

  - [x] 6.3 Write `frontend/pages/Register.jsx`
    - Render a form with name, email, password inputs and a submit button
    - On submit: validate all fields non-empty; call `register()` from `useAuth()`; on success navigate to `/`; on error display error message
    - Render a link to `/login`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.4 Write property test for error message surfacing on Register (Property 8 — Register)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 6.3**

- [x] 7. Implement Dashboard and CreateTicket pages
  - [x] 7.1 Write `frontend/pages/Dashboard.jsx`
    - On mount call `getTickets()`; manage loading, error, and data states
    - While loading show "Loading…"; on error show the error message; on empty array show "No tickets yet"
    - Render the ticket list as `<TicketCard />` components; render a "New Ticket" link/button pointing to `/tickets/new`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.2 Write property test for Dashboard error display (Property 8 — Dashboard)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 10.4**

  - [x] 7.3 Write `frontend/pages/CreateTicket.jsx`
    - Render a form with title input, description textarea, priority `<select>` defaulting to `'medium'` with options `low/medium/high`, and a submit button
    - On submit: validate title and description are non-empty; call `createTicket()`; on success navigate to `/`; on error display error message
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 7.4 Write property test for CreateTicket error display (Property 8 — CreateTicket)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 11.3**

- [x] 8. Implement TicketDetail page
  - [x] 8.1 Write `frontend/pages/TicketDetail.jsx`
    - On mount call `getTicketById(id)` and `getComments(id)` in parallel; manage loading, error, and data states
    - Render ticket fields: `title`, `description`, `<StatusBadge>`, `priority`, `created_at`
    - Render comments list; render a comment submit form; on submit with non-empty text call `postComment` then refresh comments
    - When `user.role === 'admin'`: render a status `<select>` pre-filled with current status; on change call `updateTicket` then refresh ticket data; render a delete button per comment that calls `deleteComment` then removes the comment from state
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [ ]* 8.2 Write property test for TicketDetail error display (Property 8 — TicketDetail)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 12.3**

  - [ ]* 8.3 Write property test for admin comment delete buttons (Property 14)
    - **Property 14: Admin sees delete button for every comment in TicketDetail**
    - **Validates: Requirements 12.9**

- [x] 9. Implement AdminPanel page
  - [x] 9.1 Write `frontend/pages/AdminPanel.jsx`
    - On mount call `getUsers()` and `getTickets()` in parallel; manage loading, error, and data states
    - Render users section: for each user display `name`, `email`, `role`; a role `<select>` (`user`/`admin`) that calls `updateUserRole(id, newRole)` on change and updates displayed role; a delete button that calls `deleteUser(id)` and removes the user from state
    - Render tickets section: for each ticket display `title`, `status`, owner info, and a link to `/tickets/${ticket.id}`
    - On any API error display the error message
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ]* 9.2 Write property test for AdminPanel user fields (Property 12)
    - **Property 12: AdminPanel displays required fields for every user**
    - **Validates: Requirements 13.3**

  - [ ]* 9.3 Write property test for AdminPanel ticket fields (Property 13)
    - **Property 13: AdminPanel displays required fields for every ticket**
    - **Validates: Requirements 13.7, 13.8**

  - [ ]* 9.4 Write property test for AdminPanel error display (Property 8 — AdminPanel)
    - **Property 8: API error messages are surfaced to the user**
    - **Validates: Requirements 13.6**

- [ ] 10. Wire routing in App.jsx
  - Write `frontend/App.jsx`: wrap the app in `<BrowserRouter>` and `<AuthProvider>`; define `ProtectedRoute` (redirects to `/login` when `user` is null) and `AdminRoute` (redirects to `/login` when no user, to `/` when role is not `admin`)
  - Mount routes: `/login` → `<Login>`, `/register` → `<Register>`, `/` → `<ProtectedRoute><Dashboard>`, `/tickets/new` → `<ProtectedRoute><CreateTicket>`, `/tickets/:id` → `<ProtectedRoute><TicketDetail>`, `/admin` → `<AdminRoute><AdminPanel>`
  - Render `<Navbar>` inside all protected routes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 10.1 Write property test for ProtectedRoute redirect (Property 6)
    - **Property 6: Protected routes redirect unauthenticated users**
    - **Validates: Requirements 4.7**

  - [ ]* 10.2 Write property test for redirect from public routes (Property 7)
    - **Property 7: Authenticated users redirected from public auth routes**
    - **Validates: Requirements 4.9**

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** with a minimum of 100 iterations per test
- Unit/component tests use **Vitest** + **@testing-library/react**
- The Vite dev server (`npm run dev`) must be started manually in the `frontend/` directory — do not attempt to run it as part of task execution
