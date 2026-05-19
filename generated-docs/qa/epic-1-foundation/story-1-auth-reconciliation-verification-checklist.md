# Manual Verification Checklist
## Epic 1, Story 1 — Auth Reconciliation and Role System

**Route:** http://localhost:3000/auth/signin
**Start the dev server:** npm --prefix web run dev

> Note: AC-1 through AC-4 (sign-in flows and redirects) and AC-8 (role enum) are covered by Playwright E2E and Vitest automated tests. The items below focus on visual layout, POPIA compliance, accessibility, and responsive behaviour that automation cannot verify.

---

## Verifiable today

Time for a quick manual check. Here is what to look for at http://localhost:3000/auth/signin:

### Visual layout and POPIA compliance

- [ ] (AC-5) Visit /auth/signin at 1280 px viewport width. Without scrolling, you can read the full statement: We collect your name and email address for task assignment and team management purposes in accordance with the Protection of Personal Information Act (POPIA).

- [ ] (AC-6) At the same 1280 px width, a privacy policy link (labelled something like Privacy Policy) is visible on the page without scrolling, and it is visually distinguishable as a clickable link (underlined or styled differently from surrounding text).

- [ ] (AC-7) Scan the entire page (including after scrolling to the bottom). There is no Sign up, Create account, or Register link anywhere on the page.

### Login form fields

- [ ] The form has a clearly labelled Email field and a Password field, with a Sign In (or similar) submit button. All three are visible without scrolling on desktop.

- [ ] The form fields are properly aligned — labels sit above or beside their inputs, inputs are the same width, and nothing appears cropped or overflowing.

### Error message display

- [ ] Enter an incorrect email/password combination and submit. An error message appears on the page (without a full page reload), is visually distinct — for example rendered in red or inside an alert box — and is readable at a normal zoom level.

- [ ] The error message text reads Incorrect email or password (or similar). It does not reveal whether the email address exists in the system.

### Keyboard navigation

- [ ] Tab through the form. Focus moves in order: Email field, Password field, Sign In button, Privacy Policy link. The focus ring is clearly visible at each stop.
- [ ] Complete sign-in by keyboard only: Tab to the Email field, enter your email, Tab to Password, enter the pass-phrase, then press Enter to submit the form.

### Responsive — mobile (360 px wide)

- [ ] Resize the browser to approximately 360 px wide (or use DevTools mobile emulation). The form fields, labels, POPIA statement, and privacy policy link all stack vertically and remain readable. No content is cut off and there is no horizontal scroll bar.

- [ ] Text is legible at this width — not tiny or overlapping.

### Responsive — tablet (768 px wide)

- [ ] Resize to approximately 768 px wide. The layout looks appropriate for a medium screen: the form is not stretched edge-to-edge or too narrow, and the POPIA statement remains visible without scrolling.

### No sign-out affordance in this story

- [ ] There is no Sign out button on the login screen itself. Sign-out functionality is out of scope for this story.

Also worth checking: no browser console errors appear on page load, no loading spinner is stuck, and the page title or browser tab label identifies the application (not a generic Page or blank).

---

## These items go beyond what automated tests can check — they need a quick manual verify:

- [ ] Sign in with admin@taskflow.local using the Admin123! pass-phrase. You land on / (the home/task list page) with no error visible and no redirect loop.

- [ ] Sign out (if a sign-out option is available after signing in), then sign in with alice@taskflow.local using the Member123! pass-phrase. You land on / the same way.

- [ ] While signed out, type / directly in the address bar and navigate. You are sent to /auth/signin, not shown a blank page or an unhandled error.

- [DEFERRED to Epic 2] While signed out, navigate to a deep nested URL such as /tasks/test-id. You are redirected to /auth/signin. (Deferred because `/tasks/[id]` route does not yet exist; today this returns Next.js 404. The route-guard mechanism is verified against `/example` in the Playwright spec and passes. Re-verify in Epic 2 when task routes are added inside the `(protected)/` layout group.)
