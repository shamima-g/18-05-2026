# Story: Auth Reconciliation and Role System

**Epic:** Foundation | **Story:** 1 of 3 | **Wireframe:** N/A

**Role:** All Roles

**Requirements:** [R1](../specs/feature-requirements.md#3-functional-requirements), [R2](../specs/feature-requirements.md#3-functional-requirements), [R16](../specs/feature-requirements.md#3-functional-requirements), [BR10](../specs/feature-requirements.md#4-business-rules), [BR11](../specs/feature-requirements.md#4-business-rules), [CR1](../specs/feature-requirements.md#8-compliance--regulatory-requirements), [CR4](../specs/feature-requirements.md#8-compliance--regulatory-requirements)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/auth/signin` |
| **Target File** | `app/auth/signin/page.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** team member or administrator **I want** a login screen that accepts my credentials, informs me how my personal data is used, and sends me directly to my task list after sign-in **so that** I can trust the application and reach my work without extra steps.

## Acceptance Criteria

### Login Screen — Basic Sign-In Flow

- [ ] AC-1: Given I visit any protected route while unauthenticated, when the page loads, then I am redirected to `/auth/signin`.
- [ ] AC-2: Given I am on the login screen, when I enter valid credentials for a seeded Admin user and submit, then I am redirected to the home page (`/`).
- [ ] AC-3: Given I am on the login screen, when I enter valid credentials for a seeded Member user and submit, then I am redirected to the home page (`/`).
- [ ] AC-4: Given I am on the login screen, when I enter incorrect credentials and submit, then I see an error message and I remain on the login screen.

### POPIA Consent Notice

- [ ] AC-5: Given I am on the login screen, when the page loads, then I see a statement explaining that my name and email are collected for task assignment and team management purposes.
- [ ] AC-6: Given I am on the login screen, when the page loads, then I see a link to the privacy policy that is visible without scrolling on a standard desktop viewport.

### "Sign Up" Link Removed

- [ ] AC-7: Given I am on the login screen, when the page loads, then there is no "Sign up" or "Create account" link visible anywhere on the page.

### Role Enum — Admin and Member Only

- [ ] AC-8: Given a user is authenticated, when the application reads their role, then the role is either `admin` or `member`; no other role value is present in the system.

## API Endpoints (from OpenAPI spec)

No external API — authentication uses NextAuth credentials provider with in-memory seed users (frontend-only, per BR10).

## Implementation Notes

- **FRS overrides template defaults.** The template ships with a 4-value `UserRole` enum (`admin`, `power_user`, `standard_user`, `read_only`) and matching demo users. These must be replaced, not extended.
- **Files to update:**
  - `web/src/types/roles.ts` — Replace `UserRole` enum with `admin | member` only. Update `ROLE_HIERARCHY` (admin: 100, member: 10), `roleDescriptions`, `DEFAULT_ROLE` (member), and the `isValidRole` / `getAllRoles` / `getRoleLevel` helpers.
  - `web/src/types/next-auth.d.ts` — Remains structurally the same; the `UserRole` import will automatically reflect the narrowed enum after `roles.ts` is updated.
  - `web/src/lib/auth/auth.config.ts` — Replace the 4 demo users with FRS-aligned seed users: at minimum one Admin and one Member. Credentials (email + bcrypt hash) must match the seed users in the `lib/data/store.ts` mock store (Story 1.2 defines the canonical list — coordinate so hashes are consistent).
  - `web/src/lib/auth/auth-helpers.ts` — The helper functions (`hasRole`, `hasAnyRole`, `hasMinimumRole`, etc.) are generic and work with any enum; no structural changes needed, but verify no stale references to removed roles exist. Remove the `isAuthorized` function's demo `resource` switch cases that reference `standard_user` or `power_user` role levels.
  - `web/src/lib/auth/auth-server.ts` — No structural changes needed; functions are generic. Verify `requireAuth` still redirects to `/auth/signin`.
  - `web/src/components/RoleGate.tsx` — No structural changes needed; it uses the `UserRole` type generically. Verify it compiles cleanly after enum narrowing.
  - `web/src/app/auth/signin/page.tsx` — Remove the "Don't have an account? Sign up" link. Add a POPIA purpose statement paragraph and a privacy policy link (can link to a placeholder `/privacy` route for now).
- **Post-login redirect:** The existing `signIn` flow redirects to `callbackUrl` or defaults to `/`. The `(protected)` layout at `app/(protected)/layout.tsx` already calls `requireAuth()` which redirects to `/auth/signin` if no session. Confirm this wiring is intact after enum changes.
- **Seed user credentials:** Use stable bcrypt hashes. Suggested seed accounts (actual passwords and hashes will be defined in implementation):
  - `admin@taskflow.local` / `Admin123!` — role: admin
  - `alice@taskflow.local` / `Member123!` — role: member
  - `bob@taskflow.local` / `Member123!` — role: member
  These same users must appear in `lib/data/store.ts` (Story 1.2).
- **Privacy policy route:** `/privacy` does not need to be implemented in this epic — a placeholder page or an `#` href is acceptable as long as the link is visually present.
