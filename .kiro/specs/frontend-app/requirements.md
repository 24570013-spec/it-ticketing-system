# Requirements Document

## Introduction

This document defines the requirements for the Frontend Application of the IT Helpdesk Ticketing System. The frontend is a React + Vite single-page application that communicates with the existing backend API at `http://localhost:3000`. It provides authentication, ticket management, and admin capabilities through a set of pages and shared components. The application supports two roles: regular users who manage their own tickets, and admins who can manage all tickets and users.

## Glossary

- **App**: The React + Vite single-page application served at `http://localhost:5173`
- **API_Service**: The axios instance module at `frontend/services/api.js` that handles all HTTP communication with the backend
- **Auth_Context**: The React context provided by `frontend/context/AuthContext.jsx` that stores authentication state and exposes login/logout/register actions
- **Auth_Token**: The JWT string returned by the backend on successful login or registration, stored in `localStorage` under the key `token`
- **Protected_Route**: A React route wrapper that redirects unauthenticated users to `/login`
- **Requesting_User**: The currently authenticated user whose decoded data is stored in Auth_Context
- **Router**: The `react-router-dom` router configured in `frontend/App.jsx`
- **Navbar**: The shared navigation component at `frontend/src/components/Navbar.jsx`
- **StatusBadge**: The shared component at `frontend/src/components/StatusBadge.jsx` that renders a ticket's status as a colored label
- **TicketCard**: The shared component at `frontend/src/components/TicketCard.jsx` that renders a summary of a single ticket
- **Dashboard**: The page at `frontend/pages/Dashboard.jsx` that lists all tickets accessible to the Requesting_User
- **CreateTicket**: The page at `frontend/pages/CreateTicket.jsx` that provides a form for submitting a new ticket
- **TicketDetail**: The page at `frontend/pages/TicketDetail.jsx` that shows a single ticket's full details and its comments
- **AdminPanel**: The page at `frontend/pages/AdminPanel.jsx` that allows admins to manage all users and tickets
- **Login**: The page at `frontend/pages/Login.jsx` that provides a login form
- **Register**: The page at `frontend/pages/Register.jsx` that provides a registration form

---

## Requirements

### Requirement 1: Project Setup

**User Story:** As a developer, I want the frontend project configured with the correct dependencies and build tooling, so that the application can be developed and run locally.

#### Acceptance Criteria

1. THE App SHALL include a `frontend/package.json` declaring `react`, `react-dom`, `react-router-dom`, and `axios` as production dependencies
2. THE App SHALL include a `frontend/vite.config.js` that configures Vite with the React plugin and sets the dev server port to `5173`
3. THE App SHALL include a `frontend/index.html` entry point that mounts the React application into a `<div id="root">` element
4. WHEN `npm install` is run in the `frontend/` directory, THE App SHALL install all declared dependencies successfully
5. WHEN `npm run dev` is run in the `frontend/` directory, THE App SHALL start the Vite development server on port `5173`

---

### Requirement 2: API Service Layer

**User Story:** As a developer, I want a centralized axios instance with automatic token injection, so that all API calls include authentication headers without repetitive code.

#### Acceptance Criteria

1. THE API_Service SHALL create an axios instance with `baseURL` set to `http://localhost:3000`
2. WHEN a request is made, THE API_Service SHALL attach an `Authorization: Bearer <token>` header if an Auth_Token exists in `localStorage`
3. WHEN no Auth_Token exists in `localStorage`, THE API_Service SHALL send the request without an `Authorization` header
4. THE API_Service SHALL export functions that wrap each backend endpoint: `loginUser`, `registerUser`, `getTickets`, `getTicketById`, `createTicket`, `updateTicket`, `deleteTicket`, `getComments`, `postComment`, `deleteComment`, `getUsers`, `getUserById`, `updateUserRole`, `deleteUser`
5. WHEN the backend returns an error response, THE API_Service SHALL propagate the error to the calling component without swallowing it

---

### Requirement 3: Authentication Context

**User Story:** As a user, I want my authentication state to persist across page refreshes, so that I do not need to log in again after reloading the application.

#### Acceptance Criteria

1. THE Auth_Context SHALL store the current user object and the Auth_Token as state
2. WHEN the App initializes, THE Auth_Context SHALL read the Auth_Token from `localStorage` and restore the user session if a valid token is present
3. THE Auth_Context SHALL expose a `login(email, password)` function that calls the backend login endpoint, stores the returned token in `localStorage`, and updates the user state
4. THE Auth_Context SHALL expose a `register(name, email, password)` function that calls the backend register endpoint, stores the returned token in `localStorage`, and updates the user state
5. THE Auth_Context SHALL expose a `logout()` function that removes the Auth_Token from `localStorage` and resets the user state to `null`
6. WHEN the Auth_Token is present in `localStorage` on initialization, THE Auth_Context SHALL decode the token payload and populate the user state without making an additional network request
7. THE Auth_Context SHALL make the user state and auth functions available to all child components via React context

---

### Requirement 4: Routing and Protected Routes

**User Story:** As a user, I want unauthenticated access to be blocked on private pages, so that ticket data is only visible to logged-in users.

#### Acceptance Criteria

1. THE Router SHALL render the Login page at the `/login` path
2. THE Router SHALL render the Register page at the `/register` path
3. THE Router SHALL render the Dashboard page at the `/` path, protected by a Protected_Route
4. THE Router SHALL render the CreateTicket page at the `/tickets/new` path, protected by a Protected_Route
5. THE Router SHALL render the TicketDetail page at the `/tickets/:id` path, protected by a Protected_Route
6. THE Router SHALL render the AdminPanel page at the `/admin` path, protected by a Protected_Route restricted to users with the `admin` role
7. WHEN an unauthenticated user navigates to a Protected_Route, THE Router SHALL redirect the user to `/login`
8. WHEN an authenticated non-admin user navigates to `/admin`, THE Router SHALL redirect the user to `/`
9. WHEN an authenticated user navigates to `/login` or `/register`, THE Router SHALL redirect the user to `/`

---

### Requirement 5: Login Page

**User Story:** As a user, I want to log in with my email and password, so that I can access my tickets.

#### Acceptance Criteria

1. THE Login page SHALL render a form with an email input, a password input, and a submit button
2. WHEN the user submits the form with valid credentials, THE Login page SHALL call the `login` function from Auth_Context and redirect the user to `/`
3. WHEN the login API call returns an error, THE Login page SHALL display the error message returned by the backend
4. WHEN the form is submitted with an empty email or password field, THE Login page SHALL display a validation error without calling the API
5. THE Login page SHALL render a link to the `/register` page

---

### Requirement 6: Register Page

**User Story:** As a new user, I want to create an account, so that I can start submitting helpdesk tickets.

#### Acceptance Criteria

1. THE Register page SHALL render a form with a name input, an email input, a password input, and a submit button
2. WHEN the user submits the form with valid data, THE Register page SHALL call the `register` function from Auth_Context and redirect the user to `/`
3. WHEN the register API call returns an error, THE Register page SHALL display the error message returned by the backend
4. WHEN the form is submitted with any required field empty, THE Register page SHALL display a validation error without calling the API
5. THE Register page SHALL render a link to the `/login` page

---

### Requirement 7: Navbar Component

**User Story:** As a user, I want consistent navigation available on all authenticated pages, so that I can move between sections of the application.

#### Acceptance Criteria

1. THE Navbar SHALL display a link to the Dashboard at `/`
2. WHEN the Requesting_User has the `admin` role, THE Navbar SHALL display a link to the Admin Panel at `/admin`
3. WHEN the Requesting_User does not have the `admin` role, THE Navbar SHALL not display the Admin Panel link
4. THE Navbar SHALL display a logout button that calls the `logout` function from Auth_Context
5. WHEN logout is called, THE Navbar SHALL redirect the user to `/login`
6. THE Navbar SHALL display the currently logged-in user's name or email

---

### Requirement 8: StatusBadge Component

**User Story:** As a user, I want ticket statuses displayed as clearly labeled colored badges, so that I can quickly assess the state of a ticket.

#### Acceptance Criteria

1. THE StatusBadge SHALL accept a `status` prop and render a text label matching the status value
2. WHEN the `status` prop is `'open'`, THE StatusBadge SHALL apply a blue color style
3. WHEN the `status` prop is `'in_progress'`, THE StatusBadge SHALL apply an orange color style
4. WHEN the `status` prop is `'resolved'`, THE StatusBadge SHALL apply a green color style
5. WHEN the `status` prop is `'closed'`, THE StatusBadge SHALL apply a grey color style

---

### Requirement 9: TicketCard Component

**User Story:** As a user, I want each ticket displayed as a summary card, so that I can scan the ticket list quickly without loading each ticket individually.

#### Acceptance Criteria

1. THE TicketCard SHALL accept a `ticket` prop and render the ticket's `title`, `priority`, and `status`
2. THE TicketCard SHALL render a StatusBadge component using the ticket's `status` value
3. THE TicketCard SHALL render the ticket's `created_at` date in a human-readable format
4. WHEN the TicketCard is clicked, THE TicketCard SHALL navigate the user to `/tickets/:id` for the rendered ticket

---

### Requirement 10: Dashboard Page

**User Story:** As a user, I want to see a list of my tickets on the dashboard, so that I can track the status of all my support requests.

#### Acceptance Criteria

1. WHEN the Dashboard mounts, THE Dashboard SHALL call the `getTickets` API function and display the returned tickets as a list of TicketCard components
2. WHEN the API call is in progress, THE Dashboard SHALL display a loading indicator
3. WHEN the API call returns an empty array, THE Dashboard SHALL display a message indicating no tickets exist
4. WHEN the API call returns an error, THE Dashboard SHALL display an error message
5. THE Dashboard SHALL render a link or button that navigates the user to `/tickets/new`
6. WHEN the Requesting_User has the `admin` role, THE Dashboard SHALL display all tickets returned by the API
7. WHEN the Requesting_User has the `user` role, THE Dashboard SHALL display only the tickets returned by the API for that user

---

### Requirement 11: CreateTicket Page

**User Story:** As a user, I want to submit a new support ticket through a form, so that I can report an IT issue.

#### Acceptance Criteria

1. THE CreateTicket page SHALL render a form with a title input, a description textarea, a priority selector with values `'low'`, `'medium'`, and `'high'`, and a submit button
2. WHEN the form is submitted with valid data, THE CreateTicket page SHALL call the `createTicket` API function and redirect the user to `/`
3. WHEN the API call returns an error, THE CreateTicket page SHALL display the error message returned by the backend
4. WHEN the form is submitted with an empty title or description, THE CreateTicket page SHALL display a validation error without calling the API
5. THE CreateTicket page SHALL default the priority selector to `'medium'`

---

### Requirement 12: TicketDetail Page

**User Story:** As a user, I want to view the full details of a ticket and its comments, so that I can follow the progress of my support request.

#### Acceptance Criteria

1. WHEN the TicketDetail page mounts, THE TicketDetail page SHALL call `getTicketById` and `getComments` and display the ticket's `title`, `description`, `status`, `priority`, and `created_at`, and the list of comments
2. WHEN either API call is in progress, THE TicketDetail page SHALL display a loading indicator
3. WHEN either API call returns an error, THE TicketDetail page SHALL display an error message
4. THE TicketDetail page SHALL render a StatusBadge for the ticket's current status
5. THE TicketDetail page SHALL render a form with a textarea and submit button for posting a new comment
6. WHEN the comment form is submitted with non-empty text, THE TicketDetail page SHALL call `postComment` and refresh the comment list on success
7. WHEN the Requesting_User has the `admin` role, THE TicketDetail page SHALL display a status selector that allows updating the ticket status via `updateTicket`
8. WHEN a status update is submitted, THE TicketDetail page SHALL call `updateTicket` and refresh the displayed ticket data on success
9. WHEN the Requesting_User has the `admin` role, THE TicketDetail page SHALL display a delete button for each comment that calls `deleteComment` and removes the comment from the list on success

---

### Requirement 13: AdminPanel Page

**User Story:** As an admin, I want to manage all users and tickets from a single panel, so that I can maintain the system.

#### Acceptance Criteria

1. WHEN the AdminPanel page mounts, THE AdminPanel page SHALL call `getUsers` and `getTickets` and display the results in separate sections
2. WHEN either API call is in progress, THE AdminPanel page SHALL display a loading indicator
3. THE AdminPanel page SHALL display each user's `name`, `email`, and current `role`
4. THE AdminPanel page SHALL render a role selector for each user that calls `updateUserRole` when changed and updates the displayed role on success
5. THE AdminPanel page SHALL render a delete button for each user that calls `deleteUser` and removes the user from the list on success
6. WHEN a delete or role-update API call returns an error, THE AdminPanel page SHALL display the error message returned by the backend
7. THE AdminPanel page SHALL display each ticket with its `title`, `status`, and owner information
8. THE AdminPanel page SHALL render a link for each ticket that navigates to `/tickets/:id`
