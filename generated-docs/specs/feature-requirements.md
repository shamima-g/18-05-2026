# Feature: Task Management Tool for Small Teams

## 1. Problem Statement

Small teams lack a simple, structured way to assign and track work. Team members need to see which tasks are assigned to them and record when work is done, while team admins need to create tasks, assign them to specific people, adjust deadlines, and remove completed or cancelled items. This tool provides a focused, authentication-gated task management experience with clearly separated Admin and Member roles, backed by a mock data layer.

---

## 2. User Roles

Based on the `internal-tool` roles template with canonical roles renamed Admin → Admin and User → Member per user confirmation.

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| Admin | Team administrator responsible for creating and managing tasks | Create tasks; assign tasks to any member; edit task due dates; delete tasks; view all tasks regardless of assignee; mark any task complete; manage users |
| Member | Regular team member who works on assigned tasks | View own assigned tasks only; view own task detail; mark own tasks complete |

> The full permissions matrix (all rows, all cells, conditional grants) is produced by `design-roles-agent` at DESIGN and stored at `generated-docs/specs/permissions-matrix.md`. Do not embed the full matrix here.

---

## 3. Functional Requirements

- **R1.** The application presents a Login screen that accepts an email and password; unauthenticated users cannot access any other screen.
- **R2.** On successful authentication the system redirects the user to the Task List screen.
- **R3.** An Admin user's Task List displays all tasks in the system, regardless of which member they are assigned to.
- **R4.** A Member user's Task List displays only the tasks assigned to that user; tasks assigned to other users are not visible.
- **R5.** When no tasks are available for the current user (all tasks for Admin; own tasks for Member), the Task List displays an empty-state message or illustration.
- **R6.** Selecting a task from the Task List navigates to the Task Detail screen for that task, showing title, description, due date, assigned person, and status.
- **R7.** An Admin user can open a Create Task form, populate title (required), description (optional), due date, and assigned person (required), and submit to add the task to the list.
- **R8.** The Create Task form prevents submission when the title field is empty, and displays a validation error message.
- **R9.** The Create Task form prevents submission when no assigned person is selected, and displays a validation error message.
- **R10.** An Admin user can edit the due date of an existing task from the Task Detail screen and save the change.
- **R11.** An Admin user can initiate deletion of a task; a Delete Confirmation dialog appears requiring explicit confirmation before the task is removed.
- **R12.** On confirmation in the Delete Confirmation dialog the task is removed and the user is returned to the Task List.
- **R13.** On cancellation in the Delete Confirmation dialog the task is not removed and the dialog closes.
- **R14.** A Member user can mark one of their own assigned tasks as complete from the Task Detail screen; the task status changes to `complete`.
- **R15.** An Admin user can mark any task as complete from the Task Detail screen; the task status changes to `complete`.
- **R16.** All routes except the Login screen redirect unauthenticated users to the Login screen.
- **R17.** A Member user who attempts to access the Task Detail screen of a task not assigned to them receives a 403 response or is redirected away from that route.
- **R18.** All data is persisted in an in-memory or module-level mock data layer; no real HTTP requests are made to an external API.
- **R19.** The mock data layer is initialised with seed tasks and users to support development and testing.

---

## 4. Business Rules

- **BR1.** Only users with role `admin` may create tasks; a Member has no access to the Create Task form or its route.
- **BR2.** Only users with role `admin` may edit a task's due date; the edit affordance is not rendered for Member users.
- **BR3.** Only users with role `admin` may delete a task; the delete affordance is not rendered for Member users.
- **BR4.** Only users with role `admin` may assign a task to a member; the assigned-person field is not editable by Member users.
- **BR5.** A Member may only view tasks where `task.assignedUserId === currentUser.id`; any other task is inaccessible.
- **BR6.** Task deletion requires a two-step confirmation via an explicit Delete Confirmation dialog; single-click deletion is not permitted.
- **BR7.** A task's `status` field accepts only the enum values `pending` or `complete`; no other status values are valid.
- **BR8.** The `title` field on a Task is required; a task cannot be created or saved without a non-empty title.
- **BR9.** The `assignedUserId` field on a Task is required; a task cannot be created without selecting an assigned person.
- **BR10.** Session state is managed client-side via NextAuth JWT sessions; there is no server-side BFF session component.
- **BR11.** All routes are authentication-gated; no page is publicly accessible without a valid session.

---

## 5. Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Task | `id` (string/UUID), `title` (string, required), `description` (string, optional), `dueDate` (date), `assignedUserId` (string, required), `status` (enum: `pending` \| `complete`) | Belongs to one User (via `assignedUserId`) |
| User | `id` (string/UUID), `name` (string), `email` (string), `role` (enum: `admin` \| `member`) | Has many Tasks assigned |

**Storage:** All data is held in an in-memory or module-level mock store (no database, no external API). The mock store is initialised with seed data at application start.

---

## 6. Backend Integration

No backend integration — `dataSource` is `mock-only` per the intake manifest. All API calls use mock handlers wired to the in-memory data layer. No real HTTP requests are made. NextAuth credentials provider handles authentication frontend-only; no BFF endpoint is involved.

---

## 7. Key Workflows

### 7.1 Admin — Create and Manage Tasks

1. Admin signs in on the Login screen with valid credentials.
2. System authenticates via NextAuth credentials provider and redirects Admin to the Task List.
3. Admin views the full list of all tasks (all members' tasks are visible).
4. Admin opens the Create Task form (modal or dedicated page).
5. Admin enters title (required), description (optional), due date, and selects an assigned person (required).
6. On submit, the system validates required fields. If validation fails, error messages are shown inline and submission is blocked.
7. On successful validation, the task is added to the mock store and appears in the Task List.
8. Admin selects a task from the list to open the Task Detail screen.
9. Admin edits the due date and saves; the Task Detail reflects the updated date.
10. Admin initiates deletion; the Delete Confirmation dialog appears.
11. Admin confirms deletion; the task is removed from the store and Admin is returned to the Task List.
    - Error path: Admin cancels the dialog; no deletion occurs and the dialog closes.

### 7.2 Member — View and Complete Own Tasks

1. Member signs in on the Login screen with valid credentials.
2. System authenticates via NextAuth credentials provider and redirects Member to the Task List.
3. Member views only the tasks assigned to them; tasks belonging to other users are not listed.
4. If no tasks are assigned to this Member, the empty-state screen is shown.
5. Member selects a task from the list to open the Task Detail screen.
6. Member marks the task complete; the task `status` updates to `complete` in the mock store and the Task Detail reflects the change.
    - Error path: Member navigates directly to a task URL not assigned to them; the system returns 403 or redirects back to the Task List.

### 7.3 Authentication Guard

1. Unauthenticated user attempts to access any route other than `/login` (or equivalent).
2. NextAuth middleware detects the absence of a valid session.
3. User is redirected to the Login screen.
4. After successful sign-in the user is redirected to their originally requested route (or the Task List as the default landing).

---

## 8. Compliance & Regulatory Requirements

POPIA (Protection of Personal Information Act, South Africa) applies because the app collects and processes personal data (names and email addresses) of South African users.

- **CR1.** The application must present a clear purpose statement explaining why personal data (name and email) is collected, and must obtain user consent before or at the point of data collection (e.g., on the Login / registration screen).
- **CR2.** Users must be able to request erasure of their personal data; the application must provide a mechanism (e.g., an account settings or profile page) through which a user can submit a deletion request.
- **CR3.** Personal data (user credentials, names, email addresses) must be encrypted at rest and in transit; the application must enforce HTTPS for all data transmission.
- **CR4.** A privacy policy link must be visible on all data-collection screens (Login screen and Create Task form / task assignment field) so users can review how their data is used.

---

## 9. Non-Functional Requirements

- **NFR1.** Accessibility: All interactive elements and pages must meet WCAG 2.1 Level AA criteria, including keyboard navigability and sufficient colour contrast.
- **NFR2.** Performance: First Contentful Paint must be under 2.5 seconds on a mid-tier mobile network (simulated Fast 3G).
- **NFR3.** Responsive layout: The application must be usable at viewport widths of ≥ 360 px (mobile), ≥ 768 px (tablet), and ≥ 1280 px (desktop).
- **NFR4.** Browser support: The application must function correctly in the latest two versions of Chrome, Edge, Firefox, and Safari.
- **NFR5.** Error UX: Every async operation (mock data read/write, authentication) must present a user-visible error state with a retry affordance if the operation fails.

---

## 10. Out of Scope

- Real backend API or database — all data is mock-only for this phase.
- User registration / self-sign-up — users are pre-seeded in the mock data layer.
- User invitation or user provisioning flows.
- Role assignment UI — role is set in the mock seed data; there is no in-app role management screen.
- Dark mode — not enabled in this phase; may be introduced via design tokens if needed later.
- Audit log or activity history.
- Email notifications or reminders for due dates.
- Task priority, labels, or categorisation beyond the existing fields.
- Full permissions matrix UI or fine-grained permission editing — the matrix is managed in DESIGN at `generated-docs/specs/permissions-matrix.md`.
- BFF (Backend For Frontend) session management — authentication is frontend-only via NextAuth.
- File attachments on tasks.
- Multi-team or multi-tenant support.

---

## Source Traceability

| ID | Source | Reference |
|----|--------|-----------|
| R1 | `assumptions.md` §1 | Custom auth notes — "All routes require authentication — no public access"; §3 Workflows auth guard |
| R2 | `assumptions.md` §3 | Workflows — Admin and Member primary journeys step 1 |
| R3 | `assumptions.md` §3 | Workflows — Admin primary journey ("Task list (all tasks)") |
| R4 | `assumptions.md` §3 | Workflows — Member primary journey ("Task list (own tasks only)") |
| R5 | `assumptions.md` §3 | Workflows — Empty state entry |
| R6 | `assumptions.md` §3 | Workflows — Admin and Member journeys ("Task detail") |
| R7 | `assumptions.md` §3 | Workflows — Admin primary journey ("Create task") + §1 Project description (task fields) |
| R8 | `assumptions.md` §3 | Workflows — edge path ("Create task form validates title required") |
| R9 | `assumptions.md` §3 | Workflows — edge path ("Create task form validates assigned person required") |
| R10 | `assumptions.md` §3 | Workflows — Admin primary journey ("Edit due date") |
| R11 | `assumptions.md` §3 | Workflows — Admin primary journey ("Delete task (confirm dialog)") |
| R12 | `assumptions.md` §3 | Workflows — edge path Delete confirmation dialog (confirm path) |
| R13 | `assumptions.md` §3 | Workflows — edge path Delete confirmation dialog (cancel path) |
| R14 | `assumptions.md` §3 | Workflows — Member primary journey ("Mark task complete") |
| R15 | `assumptions.md` §3 | Permissions Matrix seed — Admin: Mark own task complete ✓ |
| R16 | `assumptions.md` §3 | Workflows — Auth guard ("all routes redirect unauthenticated users") |
| R17 | `assumptions.md` §3 | Workflows — edge path ("accessing another member's task detail returns 403 / redirect") |
| R18 | `assumptions.md` §3 | Backend Connectivity Findings ("All API calls use mock handlers") + `intake-manifest.json` `context.dataSource = "mock-only"` |
| R19 | `assumptions.md` §3 | Data Model ("Mock data initialised with seed tasks and users") |
| BR1 | `assumptions.md` §3 | Permissions Matrix seed — Create task: Admin ✓, Member blank |
| BR2 | `assumptions.md` §3 | Permissions Matrix seed — Edit task due date: Admin ✓, Member blank |
| BR3 | `assumptions.md` §3 | Permissions Matrix seed — Delete task: Admin ✓, Member blank |
| BR4 | `assumptions.md` §3 | Permissions Matrix seed — Assign task to a member: Admin ✓, Member blank |
| BR5 | `assumptions.md` §3 | Workflows — Member primary journey ("own tasks only"); edge path 403 |
| BR6 | `assumptions.md` §3 | Workflows — edge path Delete confirmation ("requires explicit confirmation") |
| BR7 | `assumptions.md` §3 | Data Model — Task status enum `pending | complete` |
| BR8 | `assumptions.md` §3 | Workflows — edge path ("title required before submission") |
| BR9 | `assumptions.md` §3 | Workflows — edge path ("assigned person required before submission") |
| BR10 | `assumptions.md` §3 | Backend Connectivity Findings ("NextAuth JWT sessions, frontend-only") |
| BR11 | `assumptions.md` §1 | Critical Decisions — custom auth notes ("All routes require authentication") |
| NFR1 | `assumptions.md` §2 | NFR defaults — Accessibility: WCAG 2.1 Level AA |
| NFR2 | `assumptions.md` §2 | NFR defaults — Performance: FCP < 2.5s |
| NFR3 | `assumptions.md` §2 | NFR defaults — Responsive breakpoints |
| NFR4 | `assumptions.md` §2 | NFR defaults — Browser support |
| NFR5 | `assumptions.md` §2 | NFR defaults — Error UX with retry affordance |
| CR1 | `assumptions.md` §2 | Compliance — POPIA [INFERRED]: "clear purpose statement and user consent mechanism" |
| CR2 | `assumptions.md` §2 | Compliance — POPIA [INFERRED]: "right to erasure" |
| CR3 | `assumptions.md` §2 | Compliance — POPIA [INFERRED]: "personal data encrypted at rest and in transit" |
| CR4 | `assumptions.md` §2 | Compliance — POPIA [INFERRED]: "privacy policy link visible on all data-collection forms" |
