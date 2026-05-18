<!-- Source: .claude/agents/intake-agent.md, .claude/agents/prototype-review-agent.md, .claude/agents/api-connectivity-agent.md, .claude/agents/intake-brd-review-agent.md — keep in sync when agent process steps change -->

## INTAKE Phase — Gather Requirements, Produce Assumptions, Produce FRS

**Purpose:** Gather project requirements, produce a reviewable `assumptions.md` (interpretation of the user's context), then produce the formal Feature Requirements Specification (FRS) from the approved assumptions. The flow runs four agents and two approval gates:

1. **intake-agent Call A (scan)** ∥ **api-connectivity-agent Call A (spec analysis)** — parallel scan + spec parse; both depend only on `documentation/`
2. **Orchestrator** — welcomes user, routes between "share docs" (Option A), "prototype import" (Option B), "guided Q&A" (Option C); runs the checklist questions
3. **intake-agent Call B** — writes the intake manifest from checklist answers
4. **prototype-review-agent** (v2 only) — extracts enrichments, flags prototype assumptions, cross-validates specs; output passed verbatim into Call C
5. **api-connectivity-agent Call B** — backend smoke test (3-attempt cap + curl-fallback per policy); writes `context.backendConnectivity` to the manifest. Skipped when `dataSource` is `mock-only` or `new-api`.
6. **intake-agent Call C** — generates `assumptions.md` with connectivity findings + prototype-review output auto-merged per `.claude/shared/smoke-test-auto-merge.md`
7. **Gate 1 — assumptions approval:** user approves `assumptions.md` (or edits inline, or starts over → Call D revises)
8. **intake-brd-review-agent Call A** — reads the approved `assumptions.md` and produces the FRS with R/BR/NFR/CR numbering and source traceability
9. **Gate 2 — FRS approval:** user approves (or requests changes; "underlying assumption wrong" bounces back to Gate 1)
10. **intake-brd-review-agent Call B** — commits the bundle, transitions to DESIGN

## Key File Paths

Used to determine resume state below. Scoped-call contracts for each agent live in the agent files themselves.
- Manifest: `generated-docs/context/intake-manifest.json`
- Assumptions: `generated-docs/specs/assumptions.md`
- FRS: `generated-docs/specs/feature-requirements.md`
- Smoke-test artifact: `generated-docs/context/api-smoke-test.sh`

## Determining Current Stage After Compaction

Check these files in order:

| Manifest exists? | v2 format? | Prototype review folded into assumptions? | `assumptions.md` exists? | Assumptions approved (Gate 1)? | FRS exists? | Current stage |
|---|---|---|---|---|---|---|
| No | — | — | No | — | No | **Stage 1** — Resume intake-agent Call A (scan) |
| Yes | Yes | No | No | — | No | **Stage 1b** — Resume prototype-review-agent |
| Yes | — | Yes (or v1) | No | — | No | **Stage 1c** — Resume api-connectivity-agent (or skip to Call C) |
| Yes | — | — | Yes | No | No | **Gate 1** — Display `assumptions.md` summary and request approval |
| Yes | — | — | Yes | Yes | No | **Stage 2** — Resume intake-brd-review-agent Call A |
| Yes | — | — | Yes | — | Yes | **Gate 2** — Display FRS summary and request approval |
| — | — | — | — | — | Committed | **INTAKE complete** |

**How to check "assumptions approved":** `git log -- generated-docs/specs/assumptions.md` shows a commit (commit happens at Gate 2 finalize, but the file is written and reviewed before then). If the file is on disk but uncommitted, Gate 1 is pending or has just passed.

### Resuming from any stage

Both gates follow the shared [Gate Approval Pattern](../../shared/gate-approval-pattern.md) — display summary, AUQ, branch on response. Scoped-call contracts for each agent are in the agent files (`intake-agent.md`, `prototype-review-agent.md`, `api-connectivity-agent.md`, `intake-brd-review-agent.md`). If onboarding (welcome + Option A/B/C) hasn't happened yet, start at `start.md` Step 3; otherwise resume at the stage indicated by the table above.

Gate 2 follow-up: when the user picks "I have small changes," ask "Is the assumption itself wrong, or just how it's expressed in the FRS?" — "FRS wording" stays in `intake-brd-review-agent` Call B; "underlying assumption is wrong" bounces back to `intake-agent` Call D.

## What Happens Next

- DESIGN phase: Ensures all artifacts in `generated-docs/specs/` — `feature-requirements.md`, `api-spec.yaml`, `tokens.css`, wireframes, and the new `permissions-matrix.md` from `design-roles-agent`
- Then SCOPE → STORIES → per-story TEST-DESIGN → WRITE-TESTS → IMPLEMENT → QA cycle
