---
description: Resume interrupted TDD workflow
---

You are helping a developer resume the TDD workflow from where it was interrupted.

**Read and follow all rules in [orchestrator-rules.md](../shared/orchestrator-rules.md) — they are mandatory.**

## Execution Model

`/continue` is parent-driven. Execute phase instructions directly — read files, launch work agents via `Agent`, present approvals via `AskUserQuestion`.

## Workflow Reminder

The TDD workflow has four stages:

0. **Requirements gathering**: INTAKE (intake-agent ∥ api-connectivity-agent → [prototype-review-agent, v2 only] → intake-brd-review-agent)
1. **One-time setup**: DESIGN (mandatory) → SCOPE (define all epics, no stories yet)
2. **Per-epic**: STORIES (define stories for the current epic only)
3. **Per-story iteration**: REALIGN → TEST-DESIGN → WRITE-TESTS → IMPLEMENT → QA → commit → (next story)

After QA passes for a story:

- If more stories in epic → REALIGN for next story
- If no more stories but more epics → STORIES for next epic
- If last story in a phase's last epic (phasing enabled) → PHASE-BOUNDARY (user chooses Continue or Stop)
- If no more stories and no more epics → Feature complete!

## Step 1: Validate Workflow State and Restore Progress Display

Collect enriched workflow data **and** the TodoWrite array in a single Bash call:

```bash
node .claude/scripts/collect-dashboard-data.js --format=json --with-todos
```

The `--with-todos` flag includes a `todos` array in the JSON. After parsing the output, call `TodoWrite` with `data.todos` to restore the progress display (lost on `/clear`).

### If `status: "no_state"`:

Attempt to repair the state first:

```bash
node .claude/scripts/transition-phase.js --repair
```

If repair succeeds, show the user the detected state and ask them to confirm before proceeding.

If repair fails (no artifacts found), ask the user:

> "No workflow state or artifacts found. Would you like to start fresh with `/start`, or describe the current state so I can help you continue?"

After repair, check the **confidence level** in the output:

- `"confidence": "high"` — State is reliable, show summary and proceed
- `"confidence": "medium"` — Show the `detected` and `assumed` arrays, ask user to confirm
- `"confidence": "low"` — **REQUIRE** user to verify before proceeding, show warning prominently

After repair, re-run `collect-dashboard-data.js --format=json --with-todos` to get the enriched data and todos.

### If `status: "ok"` (state exists):

Display a brief summary:

```
Resuming: Epic [N], Story [M], Phase: [phase]
```

## Step 2: Execute Phase Instructions

Find the phase below matching the current phase in the state JSON, and execute its instructions directly.

**Execution rules:**

- Read files, launch work agents via `Agent` with the named subagent_type (test-generator, developer, code-reviewer, etc.), and present approvals via `AskUserQuestion`.
- **Display-then-ask:** Before any `AskUserQuestion` that asks the user to approve content (test-design, epic list, manual verification checklist, etc.), output the content as regular assistant text *first*. The `AskUserQuestion` `question` parameter is a short prompt — the long content lives in the preceding assistant text so the user can read what they're approving.
- **Tool budget:** keep parent tool calls per response at ~3 outside of natural turn boundaries (`AskUserQuestion` answers reset the budget). Delegate bash-heavy steps to narrow subagents — currently `playwright-runner` for E2E Verification. See orchestrator-rules.md § Parent Tool-Call Budget for the full constraint.
- Verify all script JSON output: `"status": "ok"` = proceed, `"status": "error"` = STOP and report the error.
- When launching WRITE-TESTS, IMPLEMENT, or TEST-DESIGN agents, include the FRS-over-template reminder from orchestrator-rules.md in the agent's prompt.
- Fire dashboard updates (`node .claude/scripts/generate-dashboard-html.js --collect`) at workflow milestones per the Dashboard Update Policy in orchestrator-rules.md.
- **NEVER suppress spec drift findings.** When composing the spec-compliance-watchdog prompt, do NOT include instructions to ignore, skip, or excuse any changes — regardless of how or why the drift occurred (including user-approved QA fix-cycle changes). Pass fix-cycle context as informational background only.
- Follow all rules in orchestrator-rules.md — especially scoped call patterns, voice guidelines, commit policy, and the FRS-Over-Template Rule.

### Phase: INTAKE

INTAKE runs intake-agent → optional prototype-review-agent (v2) → optional api-connectivity-agent → Gate 1 → intake-brd-review-agent → Gate 2. Determine which step to resume based on artifacts:

1. Check if `generated-docs/context/intake-manifest.json` exists:
   - No → Recover onboarding context (see below), then resume with **intake-agent Call A**
   - Yes → Check step 2

2. Check if `generated-docs/specs/assumptions.md` exists:
   - No → The intake-agent finished Call B (manifest) but didn't yet write the assumptions doc. Resume with whichever sub-step was interrupted:
     - If `context.prototypeFormat === "v2"` → re-run **prototype-review-agent** (its return is conversation-only; Call C needs it)
     - If `context.dataSource` is `existing-api` or `api-in-development` AND `context.backendConnectivity` is `null` → run **api-connectivity-agent**
     - Then run **intake-agent Call C** to produce `assumptions.md` with merged findings
   - Yes → Check step 3

3. Has Gate 1 been approved? Check whether `assumptions.md` is committed (`git log -- generated-docs/specs/assumptions.md` shows a commit) OR `generated-docs/specs/feature-requirements.md` exists:
   - No to both → **Gate 1 pending.** Display the `assumptions.md` summary and re-ask approval via `AskUserQuestion` per the gate-approval-pattern. On rejection → invoke **intake-agent Call D** to revise.
   - Yes → Check step 4

4. Check if `generated-docs/specs/feature-requirements.md` exists:
   - No → Resume with **intake-brd-review-agent Call A** (produces FRS from approved assumptions)
   - Yes → **Gate 2 pending or complete.** If the FRS isn't committed yet, display its summary and re-ask approval. On "underlying assumption wrong" → bounce back to intake-agent Call D. On approval → intake-brd-review-agent Call B commits, pushes, transitions.

#### Recovering onboarding context (no manifest yet)

**Step 1** — Infer `onboardingPath` from `documentation/`:
- If `documentation/prototype-src/` contains subdirectories OR `documentation/genesis.md` exists → `"prototype"` (v2 imports may have `genesis.md` without `prototype-src/`)
- Else if `documentation/` contains substantive files (not just `.gitkeep`) → `"docs"`
- Else → `"qa"`

**Step 2** — Recover `projectDescription`:
- If `"docs"` or `"prototype"` → `null` (docs serve as description)
- If `"qa"` → use `AskUserQuestion`: "We're picking up where we left off on requirements. I don't have the project description from last session — could you give me the elevator pitch again?"

**Step 3** — Use the scoped call patterns from orchestrator-rules.md. Call A (scan) is idempotent. Pass recovered `onboardingPath` and `projectDescription` into Call B.

#### After each agent completes

- **intake-agent Call B finished:** Check whether prototype-review or api-connectivity needs to run before Call C. Then launch Call C to produce `assumptions.md`.
- **prototype-review-agent finished:** Pass structured findings (enrichments, prototype assumptions, data-structure mismatches, genesis→FRS pre-mapping) to **intake-agent Call C** so they fold into `assumptions.md` as `[INFERRED]`/`[DEFAULT]` entries. Do NOT pass them directly to intake-brd-review-agent — BRD reads only the approved assumptions doc.
- **api-connectivity-agent finished:** `context.backendConnectivity` is now populated in the manifest. Proceed to **intake-agent Call C** — the connectivity findings auto-merge into `assumptions.md` §3 per `.claude/shared/smoke-test-auto-merge.md`.
- **intake-agent Call C finished:** Display `assumptions.md` summary and request approval (Gate 1). On rejection, invoke Call D.
- **Gate 1 approved:** Launch **intake-brd-review-agent Call A** to produce the FRS from the approved assumptions doc.
- **intake-brd-review-agent Call A finished:** Display FRS summary and request approval (Gate 2). On "underlying assumption is wrong", bounce back to intake-agent Call D. On approval or wording-only revision, launch Call B.
- **intake-brd-review-agent Call B finished:** Fire dashboard update, then instruct the user to `/clear` then `/continue` (clearing boundary #1).

### Phase: DESIGN

DESIGN is a multi-agent phase with parallel Call A execution. Read the full DESIGN Execution Model in orchestrator-rules.md.

1. Read the intake manifest: `generated-docs/context/intake-manifest.json`
2. Check which artifacts with `generate == true` are still missing. Use the artifact-to-agent mapping in orchestrator-rules.md to determine output paths. Check whether each agent's expected output file exists on disk. **E6 wireframe skip:** if `artifacts.wireframes.generate === false` (set by design-wireframe-agent Call A when Component Reference Mode applies), do NOT re-launch design-wireframe-agent — `componentReferencePath` (`_component-reference.md`) is the output.
3. For user-provided files that need copying (`generate == false` + `userProvided` set): use the copy script:
   ```bash
   node .claude/scripts/copy-with-header.js --from "<path>" --to "generated-docs/specs/<target>"
   ```
4. Determine resumption strategy:
   - **No outputs exist** → Launch all Call A agents **in a single message with parallel `Agent` calls** (full parallel execution model).
   - **Some outputs exist** → Launch Call A only for agents whose output is missing — **in a single message with parallel `Agent` calls**. Also check for `web/src/types/api-generated.ts` if `api-spec.yaml` exists.
   - **All agent outputs exist but dependents haven't run** → Launch mock-setup-agent and/or type-generator-agent as needed
   - **All outputs exist, transition not run** → DESIGN is complete. Run finalize step.

5. If all artifacts exist and transition was already run → inform user, state should be SCOPE.

For Call A results that need user approval (API spec, design tokens, screen list): display each agent's output as assistant text, then use `AskUserQuestion` to present them. Indicate which agent produced each summary.

For autonomous agents (mock-setup-agent, type-generator-agent): handle their full flow internally and report completion.

### Phase: SCOPE

Use the SCOPE scoped-call pattern from orchestrator-rules.md.

Launch feature-planner Call A:

> "This is Call A — Propose Epics. You are in SCOPE mode. Read the FRS at `generated-docs/specs/feature-requirements.md` and propose an epic breakdown. Return the epic list with descriptions and dependency map. If you propose 6 or more epics, also include a phase grouping proposal (see your Phase Grouping instructions). Do NOT write any files. Do NOT commit. Do NOT use AskUserQuestion."

After Call A returns, check whether the proposal includes a phase grouping.

**If NO phase grouping (fewer than 6 epics):** Display the epic list, then use `AskUserQuestion`.

**If phase grouping is included (6+ epics):** Display the epic list AND the phase grouping, then use `AskUserQuestion` with these 4 options:
1. "Approve both (epics and phases as proposed)"
2. "Approve epics, but change the phase grouping" — follow up to get the user's custom grouping
3. "Approve epics, no phases — just do them all in order"
4. "Revise the epics" — standard epic revision flow

When launching Call B, include the user's phase decision:
- Option 1: "Write `_feature-overview.md` with the proposed phase grouping."
- Option 2: "Write `_feature-overview.md` with this custom phase grouping: [user's grouping]."
- Option 3: "Write `_feature-overview.md` without a `## Phases` section."
- Option 4: (re-run Call A with revisions, then re-present)

### Phase: STORIES

Current epic: [N]

Run STORIES per [orchestrator-rules.md § STORIES](../shared/orchestrator-rules.md#stories-2-scoped-calls) (canonical — includes Call A/B prompts and approval flow).

### Phase: REALIGN

Current epic: [N], Current story: [M]

Run REALIGN per [orchestrator-rules.md § REALIGN](../shared/orchestrator-rules.md#realign-1-2-scoped-calls) (canonical — covers the auto-completed and revisions-proposed branches).

After REALIGN completes, proceed directly to TEST-DESIGN.

### Phase: TEST-DESIGN

Current epic: [N], Current story: [M]
Story file: [path from state]

Run TEST-DESIGN per [orchestrator-rules.md § TEST-DESIGN](../shared/orchestrator-rules.md#test-design-2-scoped-calls--ba-decision-persistence) (canonical — includes the Call A prompt, `list-ba-decisions.js` enumeration, doc display rules, batched `AskUserQuestion` for >3 decisions, `resolve-ba-decision.js` persistence, and Call B transition).

After Call B returns, proceed directly to WRITE-TESTS.

### Phase: WRITE-TESTS

Current epic: [N], Current story: [M]
Story file: [path from state]

This phase is fully autonomous. Use the WRITE-TESTS prompt from [orchestrator-rules.md § WRITE-TESTS](../shared/orchestrator-rules.md#write-tests-single-call--fully-autonomous) (canonical — includes the test-handoff path argument).

After it returns:
- Fire dashboard update.
- Proceed directly to IMPLEMENT (execute the IMPLEMENT instructions below).

### Phase: IMPLEMENT

Current epic: [N], Current story: [M]

Run IMPLEMENT per [orchestrator-rules.md § IMPLEMENT](../shared/orchestrator-rules.md#implement-single-call--fully-autonomous) (canonical — single autonomous call; the agent reads the story and test-handoff, captures a baseline `npm test` run, implements, re-tests, and returns a summary).

After it returns:
- Fire dashboard update.
- Proceed directly to QA.

### Phase: QA

Current epic: [N], Current story: [M]

QA runs the full canonical flow defined in [orchestrator-rules.md § QA (3 scoped calls)](../shared/orchestrator-rules.md#qa-3-scoped-calls): Call A → Call B → E2E Verification (Gate 6a) → Manual Verification → Spec Compliance Check (Gate 6) → Call C.

Resumption-specific routing: read the workflow state and re-enter the loop at whichever sub-step was interrupted. Use the canonical Call A/B/C prompts, the E2E Verification procedure (including halt prompts, the 3-cycle fix cap, and `e2eStatus` persistence), the QA Fix Cycle, and the Spec Compliance Check exactly as defined in orchestrator-rules.md — do not paraphrase. The verification checklist file at `generated-docs/qa/epic-N-[slug]/story-M-[slug]-verification-checklist.md` is the source of truth for every re-verification prompt; read it verbatim each time.

### Phase: PHASE-BOUNDARY

A project phase has completed. Handle two cases based on `state.phaseStatus`:

#### Case A: Fresh arrival (`phaseStatus: "ready"`)

The previous phase just completed (last epic in the current phase passed QA). The user must choose how to proceed.

1. Read workflow state and call `getPhases()` (from `workflow-helpers.js`) to determine:
   - Which phase just completed (name and epic list)
   - What comes next (next phase name and epics)

2. Display as assistant text:

   > "[Phase name] is complete! All [N] epics have passed QA.
   >
   > Next up: [Next phase name] — [Epic list]"

3. Use `AskUserQuestion` with:
   - "Continue to [next phase] as planned"
   - "Stop here — [completed phase] is enough for now"

4. Based on the user's response:
   - **Continue:** Run `node .claude/scripts/transition-phase.js --advance-phase`, then transition to STORIES for the next epic. Fire dashboard update.
   - **Stop here:** Run `node .claude/scripts/transition-phase.js --pause-phase` (sets `phaseStatus: 'paused'` and `pausedAt` to current ISO timestamp; keeps `currentPhase: 'PHASE-BOUNDARY'`). Fire dashboard update. Instruct user to `/clear`. STOP — do not advance.

#### Case B: Resume from pause (`phaseStatus: "paused"`)

The user paused earlier by picking "Stop here" and has now run `/continue`. Auto-resume without asking — running `/continue` IS the intent signal. But run a staleness check first.

1. Call `checkStaleness(state.pausedAt)` (from `workflow-helpers.js`).

2. Branch on result:
   - **`status: 'silent'`:** No files changed since pause. Run `--advance-phase` (clears `pausedAt`) and transition to STORIES for next epic. No user prompt.
   - **`status: 'notify'`:** Print a single-line informational message listing what changed (e.g., "FRS edited since pause — your upcoming epics may reference content that changed. Resuming anyway."). Then run `--advance-phase` and transition. Do NOT prompt the user.
   - **`status: 'halt'`:** Something is actually broken (missing feature-overview, corrupted state, etc.). Display the problems as assistant text and use `AskUserQuestion` to ask how to proceed. Do NOT auto-advance.

### Phase: COMPLETE

Check the next action from the state data:

- More stories in epic → Proceed to REALIGN for next story (execute REALIGN instructions)
- No more stories but more epics → Proceed to STORIES for next epic (execute STORIES instructions)
- No more stories and no more epics → Display: "Feature complete! All epics and stories have been implemented and passed QA."

## Re-ask Rule (QA Manual Verification)

If the user responds to a manual verification `AskUserQuestion` with a free-text question instead of selecting an option, answer their question, then re-ask `AskUserQuestion` with the **full manual verification checklist** included. Read the checklist verbatim from `generated-docs/qa/epic-N-[slug]/story-M-[slug]-verification-checklist.md` — never omit or abbreviate it. The checklist must be visible every time the verification question is presented.

## Script Execution Verification

**All transition scripts output JSON. Always verify the result before proceeding** (see [orchestrator-rules.md § Script Execution Verification](../shared/orchestrator-rules.md#script-execution-verification) for the full rules):

1. `"status": "ok"` = Success, proceed to next step
2. `"status": "error"` = **STOP**, report the error to the user
3. `"status": "warning"` = Proceed with caution, inform user

**Troubleshooting:**
- Check current state: `node .claude/scripts/transition-phase.js --show`
- Validate artifacts: `node .claude/scripts/validate-phase-output.js --phase <PHASE> --epic <N>`
- Repair if needed: `node .claude/scripts/transition-phase.js --repair`

## Error Handling

- **State file missing:** Use `--repair` to reconstruct from artifacts
- **State appears wrong:** Ask user to confirm or correct
- **Script fails:** Ask user to describe current state manually
- **Invalid transition:** Show allowed transitions and ask user what to do

## DO

- Always validate state at the start of the session
- Auto-proceed on high confidence state (no confirmation needed)
- Reconstruct the TodoWrite progress display before executing phase work
- Use scoped calls for every interactive agent

## DON'T

- Auto-approve anything on behalf of the user
- Skip state validation
- Trust artifact detection over the state file
- Proceed if the user says the state is wrong
- Stop for context clearing at non-boundary phase transitions
- Edit code yourself during QA fix cycles — always launch the developer agent

## Related Commands

- `/start` - Start TDD workflow from the beginning
- `/status` - Show current progress without resuming
- `/quality-check` - Validate all 5 quality gates
