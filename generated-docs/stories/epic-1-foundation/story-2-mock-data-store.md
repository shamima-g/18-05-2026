# Story: TypeScript Types and Mock Data Store

**Epic:** Foundation | **Story:** 2 of 3 | **Wireframe:** N/A

**Role:** N/A

**Requirements:** [R18](../specs/feature-requirements.md#3-functional-requirements), [R19](../specs/feature-requirements.md#3-functional-requirements), [BR7](../specs/feature-requirements.md#4-business-rules), [BR8](../specs/feature-requirements.md#4-business-rules), [BR9](../specs/feature-requirements.md#4-business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | N/A |
| **Target File** | `lib/data/store.ts`, `types/task.ts`, `types/user.ts` |
| **Page Action** | `create_new` |

## User Story

**As a** developer building Epic 2 features **I want** a typed in-memory data store with seeded tasks and users **so that** I can build and test the task management UI without a real backend.

## Acceptance Criteria

### Task Type

- [ ] AC-1: Given the `Task` type is imported, when a value is created that matches the type, then it must have the fields: `id` (string), `title` (string), `description` (optional string), `dueDate` (string or Date), `assignedUserId` (string), and `status` with value either `pending` or `complete` — no other status values compile.

### User Type

- [ ] AC-2: Given the `User` type is imported, when a value is created that matches the type, then it must have the fields: `id` (string), `name` (string), `email` (string), and `role` with value either `admin` or `member` — no other role values compile.

### Store — Read Operations

- [ ] AC-3: Given the store is initialised with seed data, when `getTasks()` is called, then it returns an array containing all seeded tasks.
- [ ] AC-4: Given a valid task ID exists in the store, when `getTaskById(id)` is called, then it returns the matching task object.
- [ ] AC-5: Given an ID that does not exist in the store, when `getTaskById(id)` is called, then it returns `null` (not an error or undefined).
- [ ] AC-6: Given the store is initialised, when `getUsers()` is called, then it returns an array of all seeded users.
- [ ] AC-7: Given a valid user ID exists in the store, when `getUserById(id)` is called, then it returns the matching user object.

### Store — Write Operations

- [ ] AC-8: Given a valid new task object is provided, when `createTask(task)` is called, then the task is added to the store and `getTasks()` subsequently returns it.
- [ ] AC-9: Given an existing task ID and an updated fields object, when `updateTask(id, updates)` is called, then `getTaskById(id)` subsequently returns the task with the updated fields merged in.
- [ ] AC-10: Given an existing task ID, when `deleteTask(id)` is called, then `getTaskById(id)` subsequently returns `null` and `getTasks()` no longer includes it.

### Seed Data

- [ ] AC-11: Given the application starts, when `getUsers()` is called, then the result includes at least one user with `role: 'admin'` and at least two users with `role: 'member'`.
- [ ] AC-12: Given the application starts, when `getTasks()` is called, then the result includes at least four tasks: at least one with `status: 'pending'` and at least one with `status: 'complete'`.
- [ ] AC-13: Given the seed tasks, when each task's `assignedUserId` is looked up via `getUserById`, then a matching user is found — no task references a non-existent user ID.
- [ ] AC-14: Given the seed users, when their emails are compared to the credentials in `auth.config.ts`, then the Admin seed user email matches the Admin demo user in the auth config, and each Member seed user email matches a Member demo user in the auth config.

## API Endpoints (from OpenAPI spec)

No external API — this story builds the mock data layer that replaces a real API (per R18). No HTTP calls are made.

## Implementation Notes

- **No external dependencies.** The store is a plain TypeScript module (or singleton object) using JavaScript arrays. No database, ORM, or fetch calls.
- **Singleton pattern:** Export the store as a module-level singleton so all server components and route handlers share the same in-memory state within a process. Example: `const store = { tasks: [...], users: [...] }; export default store;` or use named exports for each function.
- **File locations:**
  - `web/src/types/task.ts` — `Task` interface and `TaskStatus` type (`'pending' | 'complete'`).
  - `web/src/types/user.ts` — `User` interface. Note: `role` type must align with the narrowed `UserRole` enum from Story 1.1 (either import `UserRole` or use the literal union `'admin' | 'member'`).
  - `web/src/lib/data/store.ts` — All CRUD functions and seed data.
- **Seed user credentials must match `auth.config.ts`:** The three suggested accounts from Story 1.1 should appear here with consistent IDs and emails:
  - `{ id: 'u1', name: 'Admin User', email: 'admin@taskflow.local', role: 'admin' }`
  - `{ id: 'u2', name: 'Alice Member', email: 'alice@taskflow.local', role: 'member' }`
  - `{ id: 'u3', name: 'Bob Member', email: 'bob@taskflow.local', role: 'member' }`
- **Seed tasks (example — implementation may vary):** At minimum 4 tasks; include at least 1 pending and 1 complete across both members. Example coverage: 2 tasks assigned to Alice (1 pending, 1 complete), 2 tasks assigned to Bob (both pending).
- **`getTaskById` returns `null`**, not `undefined` or a thrown error, for missing IDs. This simplifies null checks in components.
- **`dueDate` format:** Use ISO date strings (`'2026-06-01'`) for simplicity; components can format for display.
- **Depends on Story 1.1** — the `UserRole` enum must be narrowed to `admin | member` before this story's types are written, to avoid type mismatches.
