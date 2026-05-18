# Project Assumptions

<!--
This document is the interpretation layer between the user's raw intent (documentation, prototype, free-text answers) and the formal Feature Requirements Specification.

The redesigned INTAKE flow uses this file for **Gate 1 approval** — the user reviews and corrects what was inferred or defaulted BEFORE the FRS is generated from these assumptions.

ORDERING RULE: lowest-confidence first, highest-confidence last.
The user's eye lands on what most needs review.

CONFIDENCE MARKERS (every entry in §2 and §3 must carry one):
- [DEFAULT]   — applied because no source addressed this (industry-standard defaults)
- [INFERRED]  — derived from a source (document, prototype, OpenAPI spec, connectivity probe, domain)

Both are review-worthy; the marker signals WHY the agent landed on this value, not whether it's correct.

The orchestrator commits this file alongside the FRS at the end of INTAKE — see CLAUDE.md §1 on session-log retention.
-->

## 1. Critical Decisions

> The user explicitly confirmed these during INTAKE. They are the load-bearing answers — do not change them without re-running the relevant checklist question.

| Decision | Value | Source |
|---|---|---|
| Onboarding path | qa | User selection |
| Project description | Build a task management tool for small teams. Team members can view tasks assigned to them and mark them complete. Admins can create tasks, assign them to any team member, edit due dates, and delete tasks. Each task has a title, description, due date, an assigned person, and a status of pending or complete. Everyone must be signed in — no public access. | Q&A path |
| Authentication method | frontend-only | User selection (policy: never inferred) |
| Custom auth notes | NextAuth credentials provider. All routes require authentication — no public access. | User input |
| API spec status | na | User selection — no backend |
| Backend readiness | na | User selection — no backend |
| → `dataSource` | mock-only | Derived: no API spec + no backend |
| → `specCompleteness` | na | Derived: no API spec |
| Compliance domains | `["popia"]` | User multi-select |
| Region (Personal data selected) | ZA — South Africa (POPIA) | User selection |
| Roles template | internal-tool | User selection |
| Custom roles (renamed) | Admin, Member | User input — renaming internal-tool's canonical Admin/User to Admin/Member |

---

## 2. Defaulted & Domain-Inferred Assumptions (review carefully)

> Entries here are either industry-standard defaults (no source addressed them) or domain-implied requirements (compliance/styling derived from a domain, not from a specific file). Per-entry markers (`[DEFAULT]` vs `[INFERRED]`) signal which kind each row is. **Review carefully; correct or accept inline.**

### Styling & Branding

- `[DEFAULT]` Palette intent: neutral light-mode default; primary accent `#2563eb` (blue-600), neutrals from Tailwind's `slate` scale
- `[DEFAULT]` Font family: system UI stack
- `[DEFAULT]` Dark mode: not enabled (introduce later via design tokens if needed)
- `[DEFAULT]` Component-specific styling deferred to DESIGN

### Compliance Implementation Details

> POPIA applies because the app collects personal data for South African users (names, email addresses used for login and task assignment).

- `[INFERRED]` Personal data collection includes a clear purpose statement and user consent mechanism
- `[INFERRED]` Right to erasure: users can request deletion of their personal data via a profile or account settings page
- `[INFERRED]` Personal data encrypted at rest and in transit
- `[INFERRED]` Privacy policy link visible on all data-collection forms (login screen, task assignment form)

### Non-Functional Requirements (industry defaults)

- `[DEFAULT]` Accessibility: WCAG 2.1 Level AA baseline
- `[DEFAULT]` Performance: First Contentful Paint < 2.5s on a mid-tier mobile network
- `[DEFAULT]` Responsive: mobile (≥360px) / tablet (≥768px) / desktop (≥1280px) breakpoints
- `[DEFAULT]` Browser support: latest two versions of Chrome / Edge / Firefox / Safari
- `[DEFAULT]` Error UX: user-visible error states with retry affordance for all async operations

---

## 3. Inferred Assumptions `[INFERRED]`

> Derived from a real source — skim for accuracy; sources are listed in §4.
>
> **Size guidance:** Each sub-section caps at ~10 entries. When a real source would produce more, the agent emits a representative subset and adds a final line like `[INFERRED] +N additional entries — see <source file> for the full list`. This keeps Gate 1 reviewable on a single screen; downstream agents read the source file directly when full detail is needed.

### Data Model

- `[INFERRED]` Entity: **Task** — fields: `id` (string/UUID), `title` (string, required), `description` (string, optional), `dueDate` (date), `assignedUserId` (reference to User), `status` (enum: `pending` | `complete`)
- `[INFERRED]` Entity: **User** — fields: `id`, `name`, `email`, `role` (enum: `admin` | `member`)
- `[INFERRED]` Relationships: Task belongs to one assigned User; one User may have many Tasks assigned to them
- `[INFERRED]` All data persisted in a mock data layer (in-memory or module-level store); no database or external API
- `[INFERRED]` Mock data initialised with seed tasks and users to support development and testing

### Workflows

- `[INFERRED]` Primary journey — Admin: Sign in → Task list (all tasks) → Create task (assign to member, set due date) → Task detail → Edit due date → Delete task (confirm dialog)
- `[INFERRED]` Primary journey — Member: Sign in → Task list (own tasks only) → Task detail → Mark task complete
- `[INFERRED]` Empty state: Task list shows an empty state illustration/message when no tasks exist (or no tasks are assigned to the current member)
- `[INFERRED]` Auth guard: all routes redirect unauthenticated users to the Login screen; no public pages
- `[INFERRED]` Error / edge path: attempting to access another member's task detail returns a 403 / redirect for Member role
- `[INFERRED]` Error / edge path: Create task form validates that title and assigned person are provided before submission
- `[INFERRED]` Error / edge path: Delete confirmation dialog requires explicit confirmation before task is removed

### Permissions Matrix (seed)

> Based on the `internal-tool` template with roles renamed Admin → Admin and User → Member per the user's confirmed input. Full editing happens at DESIGN via `design-roles-agent`.

| Permission | Admin | Member |
|---|---|---|
| View task list | ✓ | ✓ |
| View own tasks only | ✓ | ✓ |
| View all tasks (any user) | ✓ | |
| View task detail | ✓ | ✓ (own only) |
| Create task | ✓ | |
| Assign task to a member | ✓ | |
| Edit task due date | ✓ | |
| Delete task | ✓ | |
| Mark own task complete | ✓ | ✓ |
| Manage users | ✓ | |

> Note: Admin can also mark tasks complete (inherited from "edit any record" in the internal-tool template). Confirm at DESIGN whether Admin should be blocked from marking a Member's task complete.

### Backend Connectivity Findings

> No connectivity check ran — `dataSource` is `mock-only`. No backend exists for this project.

- `[DEFAULT]` All API calls use mock handlers; no real HTTP requests are made. The `web/src/lib/api/client.ts` API client will be wired to a mock data layer rather than a live endpoint.
- `[DEFAULT]` NextAuth credentials provider configured for frontend-only authentication — no BFF involved. Session state managed client-side via NextAuth JWT sessions.

---

## 4. Source Traceability

> Compact cross-reference so any inferred or defaulted entry can be traced to its source.

| Entry ID | Confidence | Source | Reference |
|---|---|---|---|
| §1.all | Explicit | User Q&A answers | Checklist Q1–Q6 captured by orchestrator |
| §2.styling.palette | `[DEFAULT]` | No source | styling-centralisation.md Pattern A |
| §2.styling.font | `[DEFAULT]` | No source | styling-centralisation.md Pattern A |
| §2.styling.darkmode | `[DEFAULT]` | No source | styling-centralisation.md Pattern A |
| §2.compliance.popia.consent | `[INFERRED]` | Domain (`popia`) | compliance-intake.md §Data Protection (GDPR/POPIA/CCPA) |
| §2.compliance.popia.erasure | `[INFERRED]` | Domain (`popia`) | compliance-intake.md §Data Protection (GDPR/POPIA/CCPA) |
| §2.compliance.popia.encryption | `[INFERRED]` | Domain (`popia`) | compliance-intake.md §Data Protection (GDPR/POPIA/CCPA) |
| §2.compliance.popia.privacypolicy | `[INFERRED]` | Domain (`popia`) | compliance-intake.md §Data Protection (GDPR/POPIA/CCPA) |
| §2.nfr.accessibility | `[DEFAULT]` | No source | Industry baseline |
| §2.nfr.performance | `[DEFAULT]` | No source | Industry baseline |
| §2.nfr.responsive | `[DEFAULT]` | No source | Industry baseline |
| §2.nfr.browser | `[DEFAULT]` | No source | Industry baseline |
| §2.nfr.errorux | `[DEFAULT]` | No source | Industry baseline |
| §3.data.task | `[INFERRED]` | Project description (Q&A) | Task fields stated by user |
| §3.data.user | `[INFERRED]` | Project description (Q&A) | Roles stated by user |
| §3.data.relationships | `[INFERRED]` | Project description (Q&A) | Assigned person field on Task |
| §3.data.mock | `[INFERRED]` | `intake-manifest.json` | `context.dataSource = "mock-only"` |
| §3.workflows.admin | `[INFERRED]` | Project description (Q&A) | Admin capabilities stated by user |
| §3.workflows.member | `[INFERRED]` | Project description (Q&A) | Member capabilities stated by user |
| §3.workflows.emptystate | `[INFERRED]` | Project description (Q&A) | Screen inventory — empty state screen listed |
| §3.workflows.authguard | `[INFERRED]` | Project description (Q&A) | "Everyone must be signed in — no public access" |
| §3.workflows.edge.403 | `[INFERRED]` | Project description (Q&A) | Member sees own tasks only — implies access restriction |
| §3.workflows.edge.validation | `[INFERRED]` | Project description (Q&A) | Create task form with required fields |
| §3.workflows.edge.delete | `[INFERRED]` | Project description (Q&A) | Delete confirmation dialog screen listed |
| §3.permissions | `[INFERRED]` | Roles template | `internal-tool` (roles-templates.md) with Admin/Member rename |
| §3.connectivity.mock | `[DEFAULT]` | `intake-manifest.json` | `context.backendConnectivity = null`, `dataSource = "mock-only"` |
| §3.connectivity.auth | `[DEFAULT]` | `intake-manifest.json` | `context.authMethod = "frontend-only"` |

<!--
Filename contract: this file lives at `generated-docs/specs/assumptions.md`.
It is committed to git alongside the FRS at the end of INTAKE.
intake-brd-review-agent consumes this file as Markdown directly to produce the FRS.
-->
