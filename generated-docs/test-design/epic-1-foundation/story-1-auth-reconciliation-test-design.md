# Test Design: Auth Reconciliation and Role System

## Story Summary

**Epic:** 1 — Foundation
**Story:** 1 of 3
**As a** team member or administrator
**I want** a login screen that accepts my credentials, informs me how my personal data is used, and sends me directly to my task list after sign-in
**So that** I can trust the application and reach my work without extra steps.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- The login screen renders an email field, a password field, and a submit button — no other sign-in methods are present.
- Signing in with valid Admin credentials redirects to the home page (`/`).
- Signing in with valid Member credentials redirects to the home page (`/`).
- Signing in with incorrect credentials shows an error message and keeps the user on the login screen.
- A POPIA purpose statement is visible on the login screen before the user submits anything.
- A privacy policy link is visible on the login screen without requiring the user to scroll.
- No "Sign up" or "Create account" link is present anywhere on the login screen.
- Any attempt to visit a protected route while unauthenticated redirects the user to `/auth/signin`.
- The role system accepts exactly two values — `admin` and `member`; the template's four-value enum (`admin`, `power_user`, `standard_user`, `read_only`) must be replaced entirely.

## Key Decisions Surfaced by AI

- The FRS (CR1) requires a "clear purpose statement" but does not specify the exact wording. The verbatim text must be confirmed before tests can assert specific content. (See BA-1.)
- CR4 requires a privacy policy link on every data-collection screen. The target URL is not specified in the FRS — the story notes an `#` placeholder or `/privacy` route are both acceptable, but the choice affects what tests assert on the `href`. (See BA-2.)
- AC-4 says "an error message" appears on invalid credentials, but does not state the exact text. The current template shows `'Invalid credentials'` as a fallback. Whether the FRS-mandated text is "Incorrect email or password" (as suggested in the orchestrator prompt) or something else must be confirmed. (See BA-3.)
- The story notes three specific seed accounts (`admin@taskflow.local`, `alice@taskflow.local`, `bob@taskflow.local`) with suggested passwords. These feed directly into Playwright sign-in tests and must be locked in before tests are written. (See BA-4.)
- The template's `DEFAULT_ROLE` is `standard_user`. After enum narrowing it must become `member`. The BA should confirm that `member` is the correct fallback for any user whose role field is missing from the JWT. (See BA-5.)

## Test Scenarios / Review Examples

### 1. Login screen renders required fields

| Input | Value |
| --- | --- |
| User state | Not signed in |
| Browser action | Navigate to `/auth/signin` |

| Expected | Value |
| --- | --- |
| Email field | Visible and accepting text input |
| Password field | Visible and masking input |
| Submit button | Visible with label "Sign In" |
| "Sign up" / "Create account" link | Absent from the page |

---

### 2. POPIA purpose statement is visible on page load

| Input | Value |
| --- | --- |
| User state | Not signed in |
| Browser action | Navigate to `/auth/signin` |

| Expected | Value |
| --- | --- |
| Purpose statement | Visible without scrolling on a standard desktop viewport (1280 px wide) |
| Statement content | Explains that name and email are collected for task assignment and team management purposes |
| Privacy policy link | Visible without scrolling; link text references the privacy policy |

> **BA decision resolved — Option A (BA-1):** The FRS (CR1) requires a "clear purpose statement" but does not provide verbatim wording. Tests need to assert the exact text that will appear on screen.
>
> Options:
> - Option A: "We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA)."
> - Option B: A shorter variant — "Your name and email are used for task assignment and team management only."
> - Option C: Another form the BA specifies.
> Resolution: Option A approved 2026-05-19 by user.

> **BA decision resolved — Option A (BA-2):** The FRS (CR4) requires a privacy policy link but does not specify the target URL. The story implementation notes suggest either `#` (placeholder anchor) or `/privacy` (a stub route).
>
> Options:
> - Option A: `href="#"` — a visual placeholder; the link is present but navigates nowhere. Tests assert the link exists.
> - Option B: `href="/privacy"` — a stub internal route is created. Tests assert the link exists and points to `/privacy`.
> - Option C: An external URL specified by the BA.
> Resolution: Option A approved 2026-05-19 by user.

---

### 3. Admin signs in with valid credentials and is redirected to home

| Setup | Value |
| --- | --- |
| Seed account | `admin@taskflow.local` (role: admin) |

| Input | Value |
| --- | --- |
| Email | `admin@taskflow.local` |
| Password | _(as confirmed in BA-4)_ |

| Expected | Value |
| --- | --- |
| Redirect destination | `/` (home / task list) |
| Remaining on sign-in page | No |
| Error message shown | None |

---

### 4. Member signs in with valid credentials and is redirected to home

| Setup | Value |
| --- | --- |
| Seed account | `alice@taskflow.local` (role: member) |

| Input | Value |
| --- | --- |
| Email | `alice@taskflow.local` |
| Password | _(as confirmed in BA-4)_ |

| Expected | Value |
| --- | --- |
| Redirect destination | `/` (home / task list) |
| Remaining on sign-in page | No |
| Error message shown | None |

---

### 5. Sign-in with incorrect credentials shows error and stays on login screen

| Input | Value |
| --- | --- |
| Email | `admin@taskflow.local` |
| Password | `WrongPassword!` |

| Expected | Value |
| --- | --- |
| Redirect | None — user stays on `/auth/signin` |
| Error message shown | Yes — visible inline on the page |
| Error message text | _(as confirmed in BA-3)_ |

> **BA decision resolved — Option A (BA-3):** The exact wording of the credential-failure error message is not specified in the FRS. The prompt suggests "Incorrect email or password." The current template displays "Invalid credentials" as a fallback.
>
> Options:
> - Option A: "Incorrect email or password" — a common, non-revealing phrasing.
> - Option B: "Invalid credentials" — the current template default.
> - Option C: Another form the BA specifies.
> Resolution: Option A approved 2026-05-19 by user.

---

### 6. Unauthenticated user visiting a protected route is redirected to sign-in

| Input | Value |
| --- | --- |
| User state | No active session (not signed in, no cookie) |
| Browser action | Navigate directly to `/` (the protected task list) |

| Expected | Value |
| --- | --- |
| Final URL | `/auth/signin` (with optional `?callbackUrl=%2F` query parameter) |
| Page shown | Login screen |

---

### 7. Role enum contains exactly admin and member

| Setup | Value |
| --- | --- |
| Runtime state | Application started, NextAuth session established for any authenticated user |

| Input | Value |
| --- | --- |
| Session user role | Read from JWT after successful sign-in |

| Expected | Value |
| --- | --- |
| Allowed role values | `admin` or `member` only |
| Disallowed values | `power_user`, `standard_user`, `read_only` (template roles — must be absent) |
| `isValidRole('power_user')` | Returns `false` |
| `isValidRole('member')` | Returns `true` |

---

## Edge and Alternate Examples

### E1. Sign-in with unknown email address shows same error as wrong password

| Input | Value |
| --- | --- |
| Email | `nobody@example.com` (not a seeded account) |
| Password | `AnyPassword1!` |

| Expected | Value |
| --- | --- |
| Error message | Same text as Example 5 — no disclosure of whether email exists |
| User remains on | `/auth/signin` |

---

### E2. Unauthenticated user visiting a deeply nested protected route is redirected

| Input | Value |
| --- | --- |
| User state | No active session |
| Browser action | Navigate directly to `/example` |

| Expected | Value |
| --- | --- |
| Final URL | `/auth/signin` |
| Page shown | Login screen |

> **Note:** The originally proposed `/tasks/some-task-id` cannot be tested in Story 1.1 because the route does not yet exist. The Playwright spec for this story targets `/example` (the only route currently inside the `(protected)/` layout group). Re-verification deferred to Epic 2 when task routes are added inside the `(protected)/` layout group.

---

### E3. Already-authenticated user navigates to sign-in page

> **BA decision resolved — Option A (BA-5):** The FRS does not specify what happens if a user who already has a valid session navigates directly to `/auth/signin`. The current template does not add a redirect-if-authenticated guard on the sign-in page.
>
> Options:
> - Option A: The sign-in page is rendered as normal — the user can sign in again (new session replaces old). No redirect.
> - Option B: The sign-in page redirects to `/` automatically when a valid session is detected.
>
> Note: Option B requires an extra guard in the sign-in page component. This story's scope (AC-1 through AC-8) does not mention this case, so Option A (no redirect guard) may be out of scope. Confirm whether this edge case should be handled in this story.
> Resolution: Option A approved 2026-05-19 by user.

---

### E4. Seed user credentials locked in for all downstream stories

> **BA decision resolved — Option A (BA-4):** The story suggests three seed accounts but marks credentials as "actual passwords and hashes will be defined in implementation." Tests for Stories 1.1, 1.2, and any Playwright sign-in flow need exact, stable credentials before tests can be written.
>
> Proposed seed accounts (confirm or amend):
>
> | Email | Password | Role |
> | --- | --- | --- |
> | `admin@taskflow.local` | `Admin123!` | admin |
> | `alice@taskflow.local` | `Member123!` | member |
> | `bob@taskflow.local` | `Member123!` | member |
>
> Options:
> - Option A: Confirm the table above as-is.
> - Option B: Amend email addresses, passwords, or add/remove users.
> Resolution: Option A approved 2026-05-19 by user.

---

> **BA decision resolved (BA-6 — Option A):** Catch-path (unexpected exception) error text on the sign-in form is "Something went wrong. Please try again." This text appears when an unexpected exception is thrown from `signIn()`; it is distinct from BA-3 ("Incorrect email or password") which covers credential-failure responses. Network failures, runtime errors, and any other thrown exceptions from the auth client surface this generic message.

---

## Out of Scope / Not For This Story

- User self-registration — there are no seed users with a "create account" path; self-sign-up is explicitly out of scope in FRS §10.
- POPIA data-erasure flow (CR2) — handled in a later story (Account/Profile modal).
- Privacy policy page content — the `/privacy` route is a stub or placeholder only; its content is not in scope for this story.
- Role-based rendering of task list items — that is Epic 1 Story 2 and Epic 2.
- OAuth or social sign-in providers — in-scope auth is credentials only via NextAuth.
- The `(protected)` route group's role-gating beyond authentication (e.g., member trying to access admin-only routes) — those are Story 1.3+ behaviors.
- Accessibility compliance beyond the basic label/role assertions listed (full WCAG audit is a QA cross-cutting concern).
