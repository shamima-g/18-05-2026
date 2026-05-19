# Epic 1: Foundation

## Description

Establishes the authenticated core of the application: reconciling the 4-role template enum with the FRS 2-role model (Admin/Member), updating seed users in `auth.config.ts`, wiring POPIA consent on the login screen, enforcing post-login redirect to the Task List home page, and building the in-memory mock data store that all Epic 2 features depend on. Also creates the authenticated shell for the Task List home page (`/`), replacing the template placeholder.

## Stories

1. **Auth Reconciliation and Role System** — Replace template's 4-role enum with `admin | member`, update all auth utilities and `RoleGate`, replace demo users with FRS-aligned seed users, add POPIA content to login screen, enforce post-login redirect to `/`, and confirm route protection. | File: `story-1-auth-reconciliation.md` | Status: Pending
2. **TypeScript Types and Mock Data Store** — Define `Task` and `User` types, build `lib/data/store.ts` singleton with full CRUD, and seed ≥1 Admin + ≥2 Members + ≥4 tasks covering both statuses. | File: `story-2-mock-data-store.md` | Status: Pending
3. **Home Page Setup (Task List Shell)** — Replace template placeholder at `/` with TaskFlow authenticated shell: "Task List" heading, app name, signed-in user name and role, and sign-out affordance. | File: `story-3-home-page-setup.md` | Status: Pending
