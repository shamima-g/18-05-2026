# Feature: Task Management Tool for Small Teams

## Summary

A focused, authentication-gated task management application for small teams with clearly separated Admin and Member roles. Admins create, assign, edit, and delete tasks; Members view and complete only their own assigned tasks. All data is persisted in a mock in-memory store — no external API or database is involved.

## Epics

1. **Epic 1: Foundation** — Authentication, route protection, role system (Admin/Member), Login screen with POPIA consent notice, post-login redirect, and in-memory mock data layer with seed tasks and users. | Status: In Progress | Dir: `epic-1-foundation/`
2. **Epic 2: Features** — Task List (role-filtered), Task Detail (status management, role-conditional editing), Create Task modal (Admin-only, with validation), Delete Confirmation dialog, and Account/Profile modal with POPIA data-erasure flow. Cross-cutting NFR coverage (accessibility, performance, responsive layout). | Status: Pending | Dir: `epic-2-features/`

## Requirements Coverage

| Epic | Requirements |
|------|-------------|
| Epic 1: Foundation | [R1](../specs/feature-requirements.md#3-functional-requirements), [R2](../specs/feature-requirements.md#3-functional-requirements), [R16](../specs/feature-requirements.md#3-functional-requirements), [R18](../specs/feature-requirements.md#3-functional-requirements), [R19](../specs/feature-requirements.md#3-functional-requirements), [BR7](../specs/feature-requirements.md#4-business-rules), [BR10](../specs/feature-requirements.md#4-business-rules), [BR11](../specs/feature-requirements.md#4-business-rules), [CR1](../specs/feature-requirements.md#8-compliance--regulatory-requirements), [CR4 (login screen)](../specs/feature-requirements.md#8-compliance--regulatory-requirements) |
| Epic 2: Features | [R3](../specs/feature-requirements.md#3-functional-requirements), [R4](../specs/feature-requirements.md#3-functional-requirements), [R5](../specs/feature-requirements.md#3-functional-requirements), [R6](../specs/feature-requirements.md#3-functional-requirements), [R7](../specs/feature-requirements.md#3-functional-requirements), [R8](../specs/feature-requirements.md#3-functional-requirements), [R9](../specs/feature-requirements.md#3-functional-requirements), [R10](../specs/feature-requirements.md#3-functional-requirements), [R11](../specs/feature-requirements.md#3-functional-requirements), [R12](../specs/feature-requirements.md#3-functional-requirements), [R13](../specs/feature-requirements.md#3-functional-requirements), [R14](../specs/feature-requirements.md#3-functional-requirements), [R15](../specs/feature-requirements.md#3-functional-requirements), [R17](../specs/feature-requirements.md#3-functional-requirements), [BR1](../specs/feature-requirements.md#4-business-rules), [BR2](../specs/feature-requirements.md#4-business-rules), [BR3](../specs/feature-requirements.md#4-business-rules), [BR4](../specs/feature-requirements.md#4-business-rules), [BR5](../specs/feature-requirements.md#4-business-rules), [BR6](../specs/feature-requirements.md#4-business-rules), [BR8](../specs/feature-requirements.md#4-business-rules), [BR9](../specs/feature-requirements.md#4-business-rules), [NFR1](../specs/feature-requirements.md#9-non-functional-requirements), [NFR2](../specs/feature-requirements.md#9-non-functional-requirements), [NFR3](../specs/feature-requirements.md#9-non-functional-requirements), [NFR4](../specs/feature-requirements.md#9-non-functional-requirements), [NFR5](../specs/feature-requirements.md#9-non-functional-requirements), [CR2](../specs/feature-requirements.md#8-compliance--regulatory-requirements), [CR3](../specs/feature-requirements.md#8-compliance--regulatory-requirements), [CR4 (create task form)](../specs/feature-requirements.md#8-compliance--regulatory-requirements) |

## Epic Dependencies

- Epic 1: Foundation (no dependencies — must be first; provides authentication, role system, and mock data layer that all features depend on)
- Epic 2: Features (depends on Epic 1 — requires working auth/session, role enum, route guards, and seeded mock data store before any task UI can be built; independent within Epic 2 stories once Epic 1 is complete)

---

## Epic 1 Stories

| # | Title | Route | Status |
|---|-------|-------|--------|
| 1 | Auth Reconciliation and Role System | `/auth/signin` | Pending |
| 2 | TypeScript Types and Mock Data Store | N/A (component) | Pending |
| 3 | Home Page Setup (Task List Shell) | `/` | Pending |
