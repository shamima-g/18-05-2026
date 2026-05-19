# Test Handoff: Auth Reconciliation and Role System

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-1-auth-reconciliation-test-design.md](./story-1-auth-reconciliation-test-design.md)
**Epic:** 1 | **Story:** 1

> **BA decisions resolved 2026-05-19.** All six decisions (BA-1 through BA-6) were approved as Option A. This handoff document supersedes the draft; all placeholder comments should be replaced with the concrete values below.

## Coverage for WRITE-TESTS

- AC-1: Unauthenticated user visiting a protected route is redirected to `/auth/signin` → Example 6, Edge Example E2
- AC-2: Valid Admin credentials → redirect to `/` → Example 3
- AC-3: Valid Member credentials → redirect to `/` → Example 4
- AC-4: Incorrect credentials → error message, user stays on login screen → Example 5, Edge Example E1
- AC-5: POPIA purpose statement visible on page load → Example 2
- AC-6: Privacy policy link visible without scrolling on standard desktop → Example 2
- AC-7: No "Sign up" or "Create account" link present → Example 1
- AC-8: Role value is `admin` or `member` only; no other role values present → Example 7

## Resolved BA Decisions — Concrete Values

These values are now fully specified. Use them verbatim in test assertions and implementation.

| Decision | Value |
| --- | --- |
| BA-1: POPIA purpose statement text | `"We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA)."` |
| BA-2: Privacy policy link `href` | `"#"` — assert link exists and contains accessible text referencing the privacy policy; do NOT assert a specific destination URL |
| BA-3: Credential error message | `"Incorrect email or password"` |
| BA-4: Seed user credentials | See table below |
| BA-5: Already-authenticated visits `/auth/signin` | No redirect guard — render the sign-in page normally. Edge Example E3 is **out of scope** for this story; do NOT write a test for it |
| BA-6: Catch-path (unexpected exception) error message | `"Something went wrong. Please try again."` — distinct from BA-3; surfaces when `signIn()` throws rather than returning a credential-failure response |

### Seed User Credentials (BA-4)

| Email | Password | Role |
| --- | --- | --- |
| `admin@taskflow.local` | `Admin123!` | admin |
| `alice@taskflow.local` | `Member123!` | member |
| `bob@taskflow.local` | `Member123!` | member |

These credentials apply to Story 1.2 (mock data store) and all Playwright sign-in specs across the project.

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document.
- Do not invent behavior not represented there or explicitly approved.
- **FRS-over-template:** The template `UserRole` enum (`POWER_USER`, `STANDARD_USER`, `READ_ONLY`) must be removed before tests that reference role types are written. Do not write tests that import or reference template-only role values.
- **All BA decisions are now resolved. Remove all `// TODO: confirm …` placeholder comments.** Use the concrete values from the table above directly in assertions.
- **Preferred render scope:**
  - Login form rendering (AC-5, AC-6, AC-7) — component/full-page render in Vitest (RTL)
  - Sign-in flows and redirects (AC-1, AC-2, AC-3, AC-4) — Playwright E2E
  - Role enum type correctness (AC-8) — Vitest unit test against the `roles.ts` module
- **Suggested primary assertions:**
  - `getByLabelText('Email')` and `getByLabelText('Password')` are present
  - `getByRole('button', { name: 'Sign In' })` is present
  - No element with text matching `/sign up/i` or `/create account/i`
  - An element containing the exact text `"We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA)."` is in the document
  - A link element with accessible text referencing the privacy policy is present in the document (assert by text, not by `href`)
  - After failed sign-in: an alert or error element containing the text `"Incorrect email or password"` is visible
  - `isValidRole('power_user')` returns `false`; `isValidRole('member')` returns `true`
  - `getAllRoles()` returns exactly `['admin', 'member']` (length 2)
- **Important ambiguity flags:**
  - The `requireAuth()` function in `auth-server.ts` currently throws an Error rather than calling `redirect()`. The `(protected)/layout.tsx` calls `requireAuth()` directly. Verify that the actual redirect to `/auth/signin` is wired correctly in the layout — this is the mechanism that AC-1 (redirect on protected route) depends on. Playwright will catch a mis-wired redirect; Vitest cannot.
  - `auth-helpers.ts` also exports `requireAuth()` (throws Error) and `auth-server.ts` exports `requireAuth()` (calls `redirect()`). There are two functions with the same name in different modules. Confirm which one the protected layout imports — the server version (`auth-server.ts`) is required for correct redirect behavior.
  - The `isAuthorized()` function in `auth-helpers.ts` contains hard-coded resource switch cases that reference `UserRole.STANDARD_USER` and `UserRole.POWER_USER`. These cases will cause TypeScript compile errors after enum narrowing. They must be removed as part of this story's implementation; verify no stale references remain after narrowing.

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| Example 1: Login screen renders required fields | Unit-testable (RTL) | Component renders static markup; email field, password field, and submit button are assertable in jsdom via RTL queries |
| Example 2: POPIA statement and privacy link visible | Unit-testable (RTL) + Manual | Text presence and link element are assertable in RTL; visual placement ("visible without scrolling") requires a manual browser check |
| Example 3: Admin sign-in → redirect to `/` | Runtime-only | Requires real NextAuth `authorize()` callback running against bcrypt hashes and a real JWT session; jsdom cannot exercise this chain |
| Example 4: Member sign-in → redirect to `/` | Runtime-only | Same as Example 3 — real auth flow required |
| Example 5: Invalid credentials → error shown | Runtime-only | Error originates from the real `authorize()` callback returning `null`; cannot be faithfully reproduced by mocking `signIn()` in jsdom without recreating the blind spot this pipeline exists to close |
| Edge Example E1: Unknown email → same error | Runtime-only | Same as Example 5 |
| Example 6: Unauthenticated → protected route → redirect to `/auth/signin` | Runtime-only | Redirect is executed by the `(protected)/layout.tsx` server component via `requireAuth()` + Next.js `redirect()` — cannot be exercised in jsdom |
| Edge Example E2: Unauthenticated → nested protected route → redirect | Runtime-only | Same as Example 6 |
| Example 7: Role enum contains only admin and member | Unit-testable (RTL) | `isValidRole`, `getAllRoles`, and the `UserRole` type can be tested directly against the `roles.ts` module in Vitest without rendering anything |
| Edge Example E3: Already-authenticated → sign-in page | Out of scope (BA-5) | BA-5 resolved as Option A — no redirect guard added; do not write a test for this case |

**Summary:**
- Unit-testable (RTL): Examples 1, 2 (text/link assertions), 7
- Runtime-only: Examples 3, 4, 5, 6, E1, E2
- Out of scope: E3

## Runtime Verification Checklist

These items cannot be verified by automated tests and must be checked during QA manual verification.

**Playwright E2E (automated, runs during QA pre-check):**
- [ ] Sign in with `admin@taskflow.local` / `Admin123!` → lands on `/` with no error
- [ ] Sign in with `alice@taskflow.local` / `Member123!` → lands on `/` with no error
- [ ] Sign in with `admin@taskflow.local` / `WrongPassword!` → stays on `/auth/signin`, error message `"Incorrect email or password"` visible
- [ ] Sign in with `nobody@example.com` / `AnyPassword1!` → stays on `/auth/signin`, error message `"Incorrect email or password"` shown (no email-existence disclosure)
- [ ] Navigate to `/` with no session → browser ends up on `/auth/signin`
- [ ] Navigate to `/example` with no session → browser ends up on `/auth/signin`

> **Note (item 6):** The originally proposed `/tasks/some-task-id` cannot be tested in Story 1.1 because the route does not yet exist. The Playwright spec targets `/example` (the only route currently inside the `(protected)/` layout group). Re-verification deferred to Epic 2 when task routes are added inside the `(protected)/` layout group.

**Manual browser checks (QA checklist — visual/UX, cannot be automated):**
- [ ] POPIA purpose statement `"We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA)."` is visible on the login screen without scrolling at 1280 px viewport width
- [ ] Privacy policy link is visible without scrolling at 1280 px viewport width
- [ ] No "Sign up" or "Create account" link appears anywhere in the page (including after scrolling)
- [ ] Error message after bad credentials is visually distinct (e.g., red alert styling) and readable
