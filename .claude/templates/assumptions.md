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
| Onboarding path | [docs / prototype / qa] | User selection |
| Project description | [free-text, or "N/A — user shared documentation"] | Q&A path / documentation |
| Authentication method | [bff / frontend-only / custom] | User selection (policy: never inferred) |
| BFF endpoints (if BFF) | login=[url], userinfo=[url], logout=[url] | User input |
| Custom auth notes (if custom) | [free-text] | User input |
| API spec status | [yes-complete / yes-partial / no / na] | User selection |
| Backend readiness | [running / in-development / na] | User selection |
| → `dataSource` | [existing-api / new-api / api-in-development / mock-only] | Derived from API spec + backend readiness |
| → `specCompleteness` | [complete / partial / none / na] | Derived from API spec answer |
| Compliance domains | [list, e.g., `["pci-dss", "gdpr"]`, or `[]`] | User multi-select |
| Region (if Personal data selected) | [ZA / UK / EU / US / CA / AU / IE / multiple / null] | User selection, OR `[INFERRED]` from prototype `localeSignals` when ≥2 signals agree (e.g., "Vitality brand + R currency + +27 phone format → ZA"). When inferred, the source breakdown is included on the row. |
| Roles template | [saas-standard / internal-tool / marketplace / editorial / custom] | User selection |
| Wireframe quality (if applicable) | [rough / detailed] | User selection |
| Designer artifact (if prototype) | `documentation/project.pen` | Imported from prototype — designer-intent reference only, not consumed for generation |

---

## 2. Defaulted & Domain-Inferred Assumptions (review carefully)

> Entries here are either industry-standard defaults (no source addressed them) or domain-implied requirements (compliance/styling derived from a domain, not from a specific file). Per-entry markers (`[DEFAULT]` vs `[INFERRED]`) signal which kind each row is. **Review carefully; correct or accept inline.**

### Styling & Branding

<!-- intake-agent populates this block verbatim from styling-centralisation.md "Pattern A — Defaulted" (no source) or "Pattern B — Inferred from source". Do not hand-edit the bullets here; edit the policy if defaults change. -->

### Compliance Implementation Details

> Only present when at least one compliance domain was flagged in §1. The multi-select confirmation establishes applicability; the per-domain `[INFERRED]` blocks are the agent's industry-standard interpretation of what each domain typically requires.

<!-- intake-agent emits one block per selected domain by reproducing the canonical text from [compliance-intake.md](../policies/compliance-intake.md) §"Per-Domain `[INFERRED]` Assumptions". The policy is the single source of truth — do not inline example wording here. -->


### Non-Functional Requirements (industry defaults)

<!-- intake-agent emits the bullets below verbatim as the NFR baseline. If defaults change, edit this template (single source of truth for NFR defaults). -->

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

- `[INFERRED]` Entities: [list — derived from OpenAPI `components.schemas`, genesis Data Structures, or prototype data files]
- `[INFERRED]` Relationships: [list]
- `[INFERRED]` Key fields per entity: [summary]

### Workflows

- `[INFERRED]` Primary user journeys: [derived from prototype task flows, genesis Task Flows, or BRD use cases]
- `[INFERRED]` Error / edge paths: [if present in source]

### Permissions Matrix (seed)

> Generated from the roles template selected in §1. Full editing happens at DESIGN via `design-roles-agent`.

| Permission | [Role 1] | [Role 2] | [Role 3] | [Role 4] |
|---|---|---|---|---|
| View main dashboard | ✓ | ✓ | ✓ | ✓ |
| ... | | | | |

### Backend Connectivity Findings

> Auto-merged from `context.backendConnectivity` (api-connectivity-agent output). Empty when no smoke test ran.

- `[INFERRED]` Backend reachable at `[baseUrl]` with `[authScheme]` auth — verified `[verifiedAt]` (Shape 2 success)
- `[INFERRED]` NFR candidate: Next.js rewrite proxy required (CORS headers absent on backend) *(present only when smoke test reported `corsWarning`)*
- `[INFERRED]` Backend connectivity deferred — `[warning verbatim]`; re-run via `/api-status` after fixing *(present only on Shape 3)*
- `[DEFAULT]` dataSource reclassified to `api-in-development` — verify during approval *(present only when smoke test returned 404 on a spec-declared endpoint)*
- `[DEFAULT]` Backend uses `[scheme]`; user-facing auth is `[authMethod]` — verify these layer correctly *(present only on auth-scheme mismatch)*
- `[INFERRED]` NFR candidate: dev environment requires `[VPN / proxy / internal-network details]` *(present only when smoke test notes mention these)*

### Prototype Enrichments

> Present only when a prototype was imported. Each entry comes from `prototype-review-agent`'s enrichment output and lands here for Gate 1 strike-through (rather than per-item accept/reject).

- `[INFERRED]` *(per enrichment)* — domain-specific consideration suggested by the prototyping tool. Strike during Gate 1 to reject.

### Prototype Assumptions Flagged

> Present only when a prototype was imported. Patterns the prototyping tool used that may not apply to production.

- `[INFERRED]` *(per assumption)* — e.g., "Prototype uses localStorage for persistence — production needs API"

### Data Structure Mismatches

> Present only when `prototype-review-agent` cross-validated genesis.md data structures against the OpenAPI spec(s) and found divergences. Each entry is presented for Gate 1 review — strike to dismiss, edit to refine, or leave to surface in the FRS as a flag.

- `[DEFAULT]` *(per mismatch)* — e.g., "Entity `Payment` has field `amountCents` in OpenAPI spec but `amount` in genesis.md §Data Structures — confirm which is authoritative"

### Sample Data

- `[INFERRED]` Fixture data available at `[path]` — `[count]` files (from prototype) *(present only when fixtures were imported)*

---

## 4. Source Traceability

> Compact cross-reference so any inferred or defaulted entry can be traced to its source.

| Entry ID | Confidence | Source | Reference |
|---|---|---|---|
| §2.styling | `[DEFAULT]` | No source | — |
| §2.compliance.* | `[INFERRED]` | Domain (`<domain>`) | Industry standard practice |
| §2.nfr.* | `[DEFAULT]` | No source | Industry baseline |
| §3.data.entities | `[INFERRED]` | `documentation/api-spec.yaml` | `components.schemas` |
| §3.workflows | `[INFERRED]` | `documentation/genesis.md` | §Task Flows |
| §3.permissions | `[INFERRED]` | Roles template | `<template name>` |
| §3.connectivity.* | `[INFERRED]` | `intake-manifest.json` | `context.backendConnectivity` |
| §3.prototype.enrichments | `[INFERRED]` | `documentation/genesis.md` | §Domain Enrichments |
| §3.prototype.assumptions | `[INFERRED]` | prototype-review-agent output | flagged-assumptions block |
| §3.prototype.mismatches | `[DEFAULT]` | prototype-review-agent output | cross-validation against OpenAPI spec |

<!--
Filename contract: this file lives at `generated-docs/specs/assumptions.md`.
It is committed to git alongside the FRS at the end of INTAKE.
intake-brd-review-agent consumes this file as Markdown directly to produce the FRS.
-->
