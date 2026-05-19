# Story: Home Page Setup (Task List Shell)

**Epic:** Foundation | **Story:** 3 of 3 | **Wireframe:** N/A

**Role:** All Roles

**Requirements:** [R1](../specs/feature-requirements.md#3-functional-requirements), [R2](../specs/feature-requirements.md#3-functional-requirements), [R16](../specs/feature-requirements.md#3-functional-requirements), [BR11](../specs/feature-requirements.md#4-business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/` |
| **Target File** | `app/page.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** signed-in team member or administrator **I want** to land on an authenticated Task List page after sign-in that shows the app name, my name and role, and a way to sign out **so that** I know I am in the right place and can orient myself before the full task list is built in Epic 2.

## Acceptance Criteria

### Authenticated Shell — Content

- [ ] AC-1: Given I am signed in and visit `/`, when the page loads, then I see a heading that reads "Task List".
- [ ] AC-2: Given I am signed in and visit `/`, when the page loads, then I see the application name "TaskFlow" displayed on the page.
- [ ] AC-3: Given I am signed in, when the page loads, then I see my own name displayed (the name associated with my logged-in account).
- [ ] AC-4: Given I am signed in, when the page loads, then I see my role displayed — either "Admin" or "Member" — next to or near my name.
- [ ] AC-5: Given I am signed in, when the page loads, then I see a sign-out control (button or link labelled "Sign out" or equivalent).

### Sign-Out Flow

- [ ] AC-6: Given I am signed in and on the home page, when I activate the sign-out control, then my session ends and I am redirected to the login screen (`/auth/signin`).

### Authentication Gate

- [ ] AC-7: Given I am not signed in, when I navigate to `/`, then I am redirected to `/auth/signin` without seeing any page content.

### Template Placeholder Removed

- [ ] AC-8: Given I am signed in and on the home page, when the page loads, then the text "Replace this with your feature implementation" is not visible anywhere on the page.

## API Endpoints (from OpenAPI spec)

No external API — session data comes from NextAuth JWT (BR10); task data in Epic 2 will come from the mock store built in Story 1.2.

## Implementation Notes

- **`app/page.tsx` is the home page at `/`.** The existing file contains only the template placeholder. Replace its entire content with the TaskFlow shell.
- **Route protection via `(protected)` layout group:** Move (or confirm) `app/page.tsx` lives inside the `app/(protected)/` directory, OR call `requireAuth()` directly at the top of the page component. The `(protected)/layout.tsx` already handles the redirect to `/auth/signin` for unauthenticated users — use that existing mechanism rather than duplicating the guard.
- **Session data:** Use `auth()` (server-side) or the `useSession` hook (client-side) to access `session.user.name` and `session.user.role`. Prefer a server component to avoid a loading flash.
- **Role display:** Show "Admin" (capital A) when `role === 'admin'`, "Member" when `role === 'member'`. A simple conditional or lookup object is sufficient.
- **Sign-out:** Use the `signOut` function from `@/lib/auth/auth-client` (already present in the template). The sign-out should redirect to `/auth/signin`.
- **Task list content is deferred to Epic 2.** This story's shell may show a "Tasks will appear here" placeholder or simply the heading with no table — what matters is that the authenticated chrome (heading, user info, sign-out) is in place and verified.
- **Depends on Stories 1.1 and 1.2** — the role enum must be narrowed (Story 1.1) and seed users must exist (Story 1.2) before the sign-in flow that exercises this page can be tested end-to-end. Story 1.2 also provides the `User` type that may be used when reading session user data.
