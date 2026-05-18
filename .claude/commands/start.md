---
description: Start the TDD workflow - begins with INTAKE to gather requirements, then proceeds through DESIGN, SCOPE, and implementation
---

Start the feature development workflow.

**Read and follow all rules in [orchestrator-rules.md](../shared/orchestrator-rules.md) — they are mandatory.**

## INTAKE Flow

`/start` drives Stage 0 (INTAKE). Subsequent stages are driven by `/continue` — see the "After INTAKE" section at the bottom of this file for the handoff and [continue.md](./continue.md) for the full pipeline.

```
/start → [onboarding routing]
       → [intake-agent Call A: scan] ∥ [api-connectivity-agent Call A: spec analysis + plan]
       → [orchestrator: checklist questions]
       → [intake-agent Call B: write manifest]
       → [prototype-review-agent (v2 only)]
       → [api-connectivity-agent Call B: smoke test] (skip when dataSource ∈ {mock-only, new-api})
       → [intake-agent Call C: generate assumptions.md w/ connectivity merge]
       → ── Gate 1: assumptions.md approval ── (rejection → intake-agent Call D → re-display)
       → [intake-brd-review-agent Call A: produce FRS from approved assumptions]
       → ── Gate 2: FRS approval ── (assumption-level rejection → Gate 1 bounce-back)
       → [intake-brd-review-agent Call B: commit bundle, transition to DESIGN]
```

`∥` = parallel Task batch. **Gate 1** (assumptions.md) reviews interpretation before R-IDs exist; **Gate 2** (FRS) reviews the formal translation. Both follow the shared [Gate Approval Pattern](../shared/gate-approval-pattern.md). Gate 2 → Gate 1 bounce-back is defined there.

## What to Do

### Step 0: Ensure Setup Is Complete

Before starting the workflow, verify that the project environment is ready. Check these two indicators:

1. `web/node_modules/` exists (dependencies installed)
2. `.claude/preferences.json` exists (git preferences configured)

If **both** exist, skip to Step 1 with a brief note: "Project setup is complete. Starting workflow."

If **either** is missing, invoke `/setup` via the Skill tool. **When `/setup` returns successfully, continue to Step 1 in the same response** — do not pause, summarise, or wait for the user. If setup fails, stop and help the user fix it before proceeding.

### Step 1: Initialize Workflow State

**Initialize the workflow state file.** This ensures `/continue` can resume the workflow if interrupted.

**Important:** This command must run from the **project root** (not `web/`). If setup just completed, the working directory may have shifted. Do NOT prepend `cd ..` — instead, use the project root path directly:

```bash
node .claude/scripts/transition-phase.js --init INTAKE
```

If state already exists with `featureComplete: true` (a prior feature finished and the user is starting a new one), archive it silently — do NOT prompt the user about cleanup — then re-init:

```powershell
$priorName = (Get-Content generated-docs/context/workflow-state.json -Raw | ConvertFrom-Json).featureName
$stamp = Get-Date -Format 'yyyyMMdd'
Move-Item generated-docs/context/workflow-state.json "generated-docs/context/workflow-state-archive-$priorName-$stamp.json"
```
```bash
node .claude/scripts/transition-phase.js --init INTAKE
```

If state already exists with `featureComplete: false`, the user is resuming a paused workflow — output: "It looks like there's a workflow already in progress. Did you mean to run `/continue`?" and stop.

### Step 1b: Open Dashboard in Browser

Fire-and-forget: generate the dashboard and open it. No confirmation message on success.

```bash
node .claude/scripts/generate-dashboard-html.js --collect
start "" "generated-docs/dashboard.html"
```

On script failure, output `"Dashboard generation failed — you can run /dashboard manually later."` and continue.

### Step 2: Initialize Progress Display

After initializing workflow state, display the TodoWrite progress list (see shared rules for the script command and pattern).

---

### Step 3: Welcome and Onboarding Routing

**Pre-scan `documentation/` first** so the routing question can be enriched with what's already there. The scan is sub-second and runs before any user prompt:

```bash
node .claude/scripts/scan-doc.js documentation/ --keywords auth,role,BFF,compliance,mock,api
```

Parse the JSON output to surface (a) whether `documentation/` is empty, (b) what file types exist (BRD, OpenAPI spec, wireframes, prototype `genesis.md` or `prototype-src/`, sample data), and (c) how many of each. Save the parsed result for `intake-agent` Call A — it's idempotent, so re-running there is fine, but the orchestrator can already enrich the welcome.

Display a welcome message starting with "Welcome to Stadium 8." followed by the context sentence matching the scan result (check the prototype condition first — it takes precedence when both apply):

- **`documentation/genesis.md` or `documentation/prototype-src/` present:** "I see prototype artifacts in `documentation/` ([detected: genesis.md / prototype-src / project.pen as applicable]). We'll use those as the starting point."
- **Other substantive files:** "I see you have [N files] in `documentation/` including [2–3 key items, e.g., 'a BRD, an OpenAPI spec, and 3 wireframes']. We'll work with whatever's there. Let's confirm your starting point."
- **Empty or `.gitkeep`-only:** "I don't see anything in `documentation/` yet — that's fine, we have several ways to get started. We'll guide you through requirements, architecture, and test-first development."

Then ask the routing question using `AskUserQuestion`. **Pre-tick the recommended option** per the ranking below, labelled "(Recommended)":

- **Question:** "How would you like to get started?"
- **Options** (recommended one listed first):
  - "I have existing docs to share" — description: "Copy project materials (specs, requirements, wireframes, API docs) into the documentation/ folder."
  - "I have a prototype repo to import" — description: "Import artifacts from a prototyping tool repo (docs, design tokens, React source)."
  - "Let's build requirements together" — description: "I'll ask questions and we'll define the requirements from scratch."

| Scan result | Recommended |
|---|---|
| `documentation/` contains substantive non-prototype files (BRD, OpenAPI spec, requirements docs) | "I have existing docs to share" |
| `documentation/genesis.md`, `documentation/prototype-src/`, or `documentation/project.pen` present | "I have a prototype repo to import" |
| `documentation/` is empty or `.gitkeep`-only | "I have a prototype repo to import" |

Guided Q&A is never `"(Recommended)"`.

---

#### Option A: Share Existing Materials

If the user chose "I have existing docs to share":

1. Tell the user:
   > "Drop whatever you have into the `documentation/` folder — feature specs, requirements docs, API schemas, wireframes, design files, meeting notes. Anything goes. I'll work with whatever's there."

2. Use `AskUserQuestion`:
   - **Question:** "Let me know when your files are in place."
   - **Options:** "Ready, I've added my files" / "Actually, let's do guided Q&A instead"

3. If "Ready": Proceed to **Step 4** (Call A will detect Mode 1 or 2 based on what was added).

4. If "Actually, let's do guided Q&A instead": Switch to the **Option C** flow below.

Store the routing result: `onboardingPath = "docs"`. Set `projectDescription = null` (the docs serve as the project description).

---

#### Option B: Prototype Import

If the user chose "I have a prototype repo to import":

1. Ask for the path as a **plain-text prompt** — output the question as regular text, do NOT use `AskUserQuestion` (see [shared rules § Open-ended prompt exception](../shared/orchestrator-rules.md#user-questions-mandatory)):
   > "What's the path to your prototype repo? You can use an absolute path (`C:\Git\my-prototype`) or a relative path (`../my-prototype`)."

2. Run the import script:
   ```bash
   node .claude/scripts/import-prototype.js --from "<user-provided-path>"
   ```

3. If `status: "ok"`: Display the summary based on the `format` field in the output:

   **v2 format** — display:
   ```
   Imported from prototype (v2 format):

     Requirements:  genesis.md (unified requirements document)
     Design:        tokens.css (CSS design tokens) + project.pen (Pencil design)
     API Specs:     [list from apiSpecs array, or "None"]
     Prototype:     [screen count] screens ([screen names from prototypeSrc.screens])
     Mock Data:     [count] fixture files
     Stories:       [count] implementation artifacts (index only)
   ```

   If multiple API specs found, list each on a separate line. If `warning` is set, display it before proceeding.

   **v1 format** — display: file counts, prototype names detected (existing behaviour).

   Store `importFormat = output.format` and `originalRepoPath = output.originalRepoPath` for later use. Then proceed to **Step 4** (Call A will detect Mode 1 from the imported docs).

4. If `status: "error"`: Display the error message and suggestion. Use `AskUserQuestion`:
   - **Question:** "The import didn't work. What would you like to do?"
   - **Options:** "Let me fix the path and try again" / "I'll copy files manually instead" / "Let's do guided Q&A instead"
   - If "fix the path": re-ask for the path and retry
   - If "copy files manually": switch to **Option A** flow
   - If "guided Q&A": switch to **Option C** flow

Store the routing result: `onboardingPath = "prototype"`. Set `projectDescription = null` (the imported docs serve as the project description).

---

#### Option C: Guided Q&A

If the user chose "Let's build requirements together":

1. Ask for the project description as a **plain-text prompt** (see [shared rules § Open-ended prompt exception](../shared/orchestrator-rules.md#user-questions-mandatory)):
   > "What are you building? Give me the elevator pitch — who's it for, what does it do, and what's the core problem it solves. As much or as little detail as you like."

2. Capture the user's response as `projectDescription`.

3. Store the routing result: `onboardingPath = "qa"`. Proceed to **Step 4**.

---

### Step 4: INTAKE Phase — Gather Requirements

The redesigned INTAKE phase runs in this order:

```
4a. intake-agent Call A: scan  ∥  api-connectivity-agent Call A: spec analysis + plan   (parallel Task batch)
4b. orchestrator: checklist questions
4c. intake-agent Call B: write manifest
4d. prototype-review-agent (v2 only)
4e. api-connectivity-agent Call B: smoke test (skip when dataSource is mock-only or new-api)
4f. intake-agent Call C: generate assumptions.md with connectivity merge
4g. ── Gate 1: assumptions.md approval ──
4h. intake-brd-review-agent Call A: produce FRS from approved assumptions
4i. ── Gate 2: FRS approval ──
4j. intake-brd-review-agent Call B: commit bundle + transition to DESIGN
```

Each step is described below.

---

#### Step 4a: Parallel Call A — Scan + Spec Analysis

Fire `intake-agent` Call A and `api-connectivity-agent` Call A **in a single Task batch** (one assistant turn with two Agent invocations). Both depend only on `documentation/`; neither needs the other's output.

**intake-agent prompt:**
> "This is Call A — Scan + Analyze. Scan documentation/ for existing specs, catalog what you find, detect operating mode, infer the rolesTemplate from any role mentions per `.claude/shared/roles-templates.md`, and return structured results. Do NOT produce the manifest or assumptions.md. Do NOT use AskUserQuestion. Do NOT commit."

**api-connectivity-agent prompt:**
> "This is Call A — Analyze + Plan. Read any OpenAPI spec(s) in documentation/, parse securitySchemes, resolve the base URL, choose a smoke-test endpoint, and identify what credential info is missing. If no spec exists, return an empty plan and exit. Do NOT run curl. Do NOT write to the manifest. Do NOT use AskUserQuestion. Do NOT commit."

**Await both returns** before continuing to Step 4b. The intake-agent return contains scan results (`scanSummary`, `mode`, `inferredAnswers` including `rolesTemplate` and `complianceDomainsDetected`, `hasWireframes`, `wireframePaths`). The api-connectivity-agent return contains the smoke-test plan to be used at Step 4e (or an empty plan when no spec exists, in which case Step 4e auto-skips alongside the dataSource check).

---

#### Step 4b: Orchestrator — Checklist Questions

Display the scan summary to the user, then run the checklist.

##### Step 4b-pre: Auto-resolve from prototype sources

**Before the checklist runs**, if `onboardingPath == "prototype"`, silently auto-resolve Q2 (styling) and/or Q6 (wireframe quality) from sources that were imported. These are recorded as resolved answers — the user does NOT see a question for them. Gate 1 (Step 4g) remains the user's correction surface.

This step is a no-op on `onboardingPath == "docs"` or `"qa"` — Q2 and Q6 fire normally on those paths.

**Ordering:**

1. Receive Call A return (`inferredAnswers` for Q1/Q2/Q5; the prototype-source flags; scan summary).
2. Apply the Q2 and Q6 auto-resolutions (below). They read disjoint flags and write disjoint state — order between them does not matter.
3. Compute the **narrowed eligible set** for the bulk-accept rule: start with `{Q1 (roles), Q2 (styling), Q5 (compliance)}` and remove Q2 (styling) if it was auto-resolved at step 2. The bulk-accept threshold is then evaluated against the narrowed set, not the original.
4. At Step 4c, pass the auto-resolved values to `intake-agent` Call B as if the user had answered them.

**Q2 (styling) auto-resolution** — fires when `onboardingPath == "prototype"` AND (`hasDesignTokens === true` OR `hasDesignFile === true`).

When triggered:
- Record `styling = "from-prototype"` in orchestrator working state, with `stylingSource = "tokens.css"` (preferred when `hasDesignTokens`) else `"project.pen"`.
- Call C emits the styling block as Pattern B `[INFERRED]` per [styling-centralisation.md](../policies/styling-centralisation.md).

**Q6 (wireframe quality) auto-resolution** — fires when `onboardingPath == "prototype"` AND (`hasDesignFile === true` OR `hasPrototypeSrc === true` OR `hasWireframes === true`).

When triggered:
- Record `wireframeQuality = "detailed"` in orchestrator working state.
- Pass to Call B as if the user had selected `"Detailed, use as-is"`. Call C records it in §1 Critical Decisions and notes the source (`.pen` + `prototype-src/`) in §3.

##### Mode 1 Bulk-Accept — three-branch deterministic rule

The bulk-accept treatment is determined by **how many `inferredAnswers` from Call A fall in the narrowed eligible set** as computed at Step 4b-pre step 3.

Not eligible at all (always asked explicitly): **Q3 (API spec + backend)** — factual, not inferrable; **Q4 (auth)** — policy-mandated explicit question per [`authentication-intake.md`](../policies/authentication-intake.md), never folded; **Q6 (wireframe quality)** — eligible for auto-resolution on the prototype path (see Step 4b-pre) but never folded into bulk-accept.

| Inference count in narrowed set | Treatment |
|---|---|
| **0** | No bulk-accept prompt. No pre-ticks. Run the batched checklist normally. |
| **1** | No bulk-accept prompt. Pre-tick the single inferred option as `"(Recommended)"` inside its existing batched call. |
| **≥2** | Fire the bulk-accept `AskUserQuestion` below before the batched checklist. |

**Bulk-accept AUQ (fires only on ≥2 inferences in narrowed set):**

Display the inferred values as conversation text first (omit any line that isn't in the narrowed set or has no inference):

> "Based on the documents in `documentation/`, I inferred these answers:
>
> - **Roles:** [inferredAnswers.rolesTemplate, e.g., 'SaaS Standard (Owner / Admin / Member / Viewer)']
> - **Styling:** [inferredAnswers.styling, e.g., 'Dark theme, brand colours from design-brief.md']  *(omit on prototype paths where Q2 was auto-resolved)*
> - **Compliance:** [inferredAnswers.complianceDomainsDetected joined, e.g., 'GDPR (from personal-data mentions)']
>
> What would you like to do?"

Then call `AskUserQuestion`:

- header: `"Mode 1"`
- question: `"How should we proceed with these inferred answers?"`
- options (3):
  - label: `"Accept all"` — description: `"Use them as-is; we'll still ask about API spec, backend, and authentication explicitly"`
  - label: `"Let me adjust specific ones"` — description: `"Drop me into the checklist with these pre-ticked"`
  - label: `"Redo from scratch"` — description: `"Ignore the inferences; ask all checklist questions afresh"`

Across all three branches, auto-resolutions from Step 4b-pre persist — they are source-traceable (token files / prototype source), not heuristic inferences. Gate 1 is the correction surface.

Branching:
- **Accept all:** Skip the narrowed-eligible-set batched calls — the inferred values become the final answers. Proceed directly to Q3 (Batched Call 2), then Q4. Q6 only fires if `hasWireframes` is true AND Q6 was not auto-resolved at Step 4b-pre. No region or "no compliance" follow-up — keyword detection already produced specific domain IDs (`gdpr`/`popia`/`ccpa`).
- **Let me adjust specific ones:** Run the full batched checklist below with the inferred options pre-ticked as `"(Recommended)"`. Compliance Region and "no compliance" follow-ups still fire if applicable based on the user's edits.
- **Redo from scratch:** Clear `inferredAnswers` from working state. Run the full batched checklist below with no pre-ticks.

##### Batched Checklist (4 calls)

Otherwise — or when the user picks "Let me adjust" / "Redo from scratch" above — run the batched checklist. **Batch independent questions** to reduce user-round-trip count from 6 sequential prompts down to 4 batched calls:

| Call | Questions | Reason for batching (or not) |
|---|---|---|
| 1 | Q1 (roles) + Q2 (styling) | Both independent; both have only at-most-one conditional follow-up after the answer |
| 2 | Q3a (API spec) + Q3b (Backend readiness) | Naturally a paired question (spec + readiness) |
| 3 | Q4 (auth) | Stays separate — BFF/custom conditional sub-flow needs to fire in real time |
| 4 | Q5 (compliance multi-select) + Q6 (wireframe quality, when applicable) | Both independent; Q6 is conditional on `hasWireframes` so the call has 1 or 2 questions |

Conditional follow-ups (the styling free-text on "Let me describe", the BFF endpoint URLs, the compliance Region prompt) still fire sequentially after their parent batched call returns. Q1 (roles) no longer has a drilldown — the four explicit templates silently accept their canonical role lists, and the AUQ auto-"Other" affordance handles the `custom` template inline; see Batched Call 1 below.

**Auto-resolution exception (applies to all batched calls):** Any question that was auto-resolved at Step 4b-pre is omitted from its batched call along with its conditional follow-ups. The auto-resolved value flows to `intake-agent` Call B at Step 4c as if the user had answered it.

> **Prototype Assumptions Warning:** When scan results show `hasPrototypeDocs: true`, do not silently inherit prototype-scoped values (mock APIs, localStorage, simplified auth). Verify each at the questions below — see `intake-agent.md` § "Prototype vs Production Assumptions" for the policy.

If the user came through **Option B** (prototype import), the scan results will be rich. Reference specific prototype findings when asking confirmations. If they came through **Option C** (guided Q&A), use the project description to make these questions more specific.

##### Batched Call 1 — Q1 (Roles) + Q2 (Styling)

Fire a single multi-question `AskUserQuestion` containing both Q1 and Q2. Q1 has no drilldown after this call returns — the four explicit templates silently accept their canonical role lists, and the auto-"Other" affordance handles `custom` inline (see "Post-selection behaviour for Q1" below). Q2's "Let me describe" free-text still fires sequentially after the call returns. (If Q2 was auto-resolved at Step 4b-pre, this call contains only Q1.)

**Q1 — Roles Template Selection.** Reference: [`roles-templates.md`](../shared/roles-templates.md).

- header: `"Roles"`
- question: `"Which roles template fits your app?"`
- options (4 explicit templates — AUQ auto-provides an "Other" free-text affordance for the `custom` template; do **not** list "Custom" as an explicit option per the AUQ tool contract):
  - label: `"SaaS Standard"` — description: `"Owner / Admin / Member / Viewer — multi-tenant SaaS"`
  - label: `"Internal Tool"` — description: `"Admin / User — internal back-office or dashboard"`
  - label: `"Marketplace"` — description: `"Buyer / Seller / Moderator — two-sided platform"`
  - label: `"Editorial"` — description: `"Editor / Author / Contributor / Reader — content systems"`

When Mode 1 produced an `inferredAnswers.rolesTemplate` matching one of the four explicit templates, pre-tick that option (label it `"(Recommended)"`). If the inferred template is `custom`, leave all four options unticked so the user reaches custom via the auto-Other affordance.

**Q2 — Styling / Branding.**

- header: `"Styling"`
- question: `"Any specific colours, themes, or design system preferences? Dark mode, light mode, or both?"`
- options:
  - label: `"No specific preferences"` — description: `"Use sensible defaults; we can revise at DESIGN"`
  - label: `"Let me describe"` — description: `"I have palette / font / dark-mode preferences"`

Note: only **palette intent and font family** are captured at INTAKE per the [styling centralisation policy](../policies/styling-centralisation.md). Component-specific styling emerges at DESIGN.

**Post-selection behaviour for Q1 (no drilldown — silent accept with inline acknowledgement):**

When the user picks one of the four explicit templates, the orchestrator silently accepts the canonical role list from [`roles-templates.md`](../shared/roles-templates.md) without firing a drilldown or free-text follow-up. Capture `rolesTemplate` accordingly and post a one-line plain-text acknowledgement before continuing:

> `"Captured: <roles list>. You can refine these in assumptions.md at Gate 1, or adjust the full permissions matrix at DESIGN."`

When the user picks the auto-provided "Other" affordance, the free-text role list arrives in the same AUQ response (no separate prompt). Capture as `rolesTemplate: "custom"` and `customRoles: string[]` (split on newlines or commas; trim whitespace). Post the same one-line acknowledgement, substituting the captured role list.

**Conditional follow-up for Q2 (unchanged):**

- If Q2 returned `"Let me describe"`, ask as a plain-text prompt: `"What's the styling direction? Brand colours, fonts, light/dark mode, any references?"`

Capture: `rolesTemplate: "saas-standard" | "internal-tool" | "marketplace" | "editorial" | "custom"`, optionally `customRoles`, and the styling notes.

##### Batched Call 2 — Q3a (API spec) + Q3b (Backend readiness)

Two questions in a single `AskUserQuestion` call.

If prototype docs exist and specify mock/localStorage, prepend to Q3a's question text: "The prototype spec calls for mock data with localStorage — that's typical for prototypes. For the production app: "

If `hasApiSpec: true` from scan results, prepend to Q3a's question text: "I found an API spec at [apiSpecPaths]. "

**Q3a** — API Specification:
- header: `"API spec"`
- question: `"Do you have an OpenAPI or Swagger specification?"`
- options (4):
  - label: `"Yes, complete"` — description: `"Covers all the endpoints the app needs"`
  - label: `"Yes, partial"` — description: `"Some endpoints are missing or still being designed — we'll generate the rest"`
  - label: `"No"` — description: `"We'll design the full API spec from your requirements"`
  - label: `"N/A — no backend API"` — description: `"The app won't call a backend (static data, localStorage, etc.)"`

**Q3b** — Backend Readiness:
- header: `"Backend"`
- question: `"Is your backend API up and running?"`
- options (2):
  - label: `"Yes, it's running"` — description: `"API calls go directly to your backend"`
  - label: `"No, still in development"` — description: `"We'll set up a mock layer so you can build the frontend now"`

**Decision matrix** — map the combined answers to `dataSource` / `specCompleteness` / mock-layer flag.

| Q3a (Spec?) | Q3b (Backend?) | `dataSource` | `specCompleteness` | Mock layer? |
|---|---|---|---|---|
| Yes, complete | Yes, it's running | `existing-api` | `complete` | No |
| Yes, complete | No, still in development | `api-in-development` | `complete` | Yes |
| Yes, partial | Yes, it's running | `existing-api` | `partial` | No |
| Yes, partial | No, still in development | `api-in-development` | `partial` | Yes |
| No | Yes, it's running | `new-api` | `none` | No |
| No | No, still in development | `api-in-development` | `none` | Yes |
| N/A — no backend API | *(any answer)* | `mock-only` | N/A | No |

**Spec validation:** If the user chose "Yes, complete" or "Yes, partial" but `hasApiSpec: false` from the scan, note: "I didn't find an API spec in documentation/ — please add your OpenAPI/Swagger file there so we can use it." Wait for confirmation before proceeding.

Capture as: `dataSource`, `specCompleteness`.

##### Batched Call 3 — Q4 (Authentication Method)

Stays as a separate call (not batched) because of the conditional BFF/Custom sub-flow that fires in real time after the answer. This question is policy-mandated and **never folded** — see [authentication-intake.md](../policies/authentication-intake.md). Always present all three options explicitly, even when Mode 1 inferred an answer (inference still pre-ticks; user must confirm).

- "How will users authenticate?"
  - Options: "Backend For Frontend (recommended)" / "Frontend-only (next-auth)" / "Custom"
  - "Backend For Frontend" description: "Backend handles OIDC login/logout, sets cookies. Frontend calls backend for user info."
  - "Frontend-only (next-auth)" description: "Next.js handles auth directly using next-auth with credentials/OAuth providers. Note: API calls to the backend will not carry authenticated session context — this approach only protects frontend routes."
  - "Custom" description: "I have a different authentication/authorization approach in mind."

- If **frontend-only** selected, display the trade-off warning per [authentication-intake.md](../policies/authentication-intake.md) Rule 5 (API calls won't carry session context).

- If **BFF** selected, display the backend-requirements + CI-implication note per [authentication-intake.md](../policies/authentication-intake.md) Rule 4, then ask the three endpoint URLs as plain-text prompts:
  - "What is the login endpoint URL?"
  - "What is the userinfo endpoint URL?"
  - "What is the logout endpoint URL?"

- If **Custom** selected, ask as a plain-text prompt: "Describe your authentication and authorization approach — what technology, protocol, or pattern will you use, and how should the frontend handle login, logout, and session verification?"

- Capture as `authMethod: "bff" | "frontend-only" | "custom"`. If BFF: `bffEndpoints: { login, userinfo, logout }`. If custom: `customAuthNotes`.

##### Batched Call 4 — Q5 (Compliance) + Q6 (Wireframe quality, when applicable)

Fire a single multi-question `AskUserQuestion` containing Q5 (multi-select) and — if `hasWireframes: true` AND Q6 was NOT auto-resolved at Step 4b-pre — Q6 (single-select). Otherwise the call has only Q5.

Conditional follow-ups (the Region prompt after Q5 — fires only when prototype `localeSignals` can't fold it; see below — and the "no compliance" confirmation when nothing is selected) fire sequentially after this call returns.

**Q5 — Compliance & Regulatory (multi-select).** Reference: [`compliance-intake.md`](../policies/compliance-intake.md). The redesign collapses the prior per-domain follow-up questions to **zero** — the implementation details fold into `assumptions.md` §2 as `[INFERRED]` entries.

Before asking, run keyword detection over `documentation/`, the project description, and prior checklist answers per the policy's Keyword Triggers table. Build a list of detected domains (`complianceDomainsDetected` from Call A's `inferredAnswers`).

- header: `"Compliance"`
- question: `"Which of these compliance areas apply to this project? (Select all that apply.)"`
- multiSelect: `true`
- options (regional data-protection variants are collapsed under "Personal data" and resolved via the region follow-up below):
  - label: `"Payment / card data (PCI-DSS)"` — pre-tick if `pci-dss` detected
  - label: `"Personal data (GDPR / POPIA / CCPA)"` — pre-tick if any of `gdpr`, `popia`, `ccpa` detected
  - label: `"Health / patient data (HIPAA)"` — pre-tick if `hipaa` detected
  - label: `"Multi-tenant SaaS (SOC 2)"` — pre-tick if `soc2` detected

**Q6 — Wireframe Quality (only when `hasWireframes: true`).**

- header: `"Wireframes"`
- question: `"Are these wireframes rough references or detailed enough for implementation?"`
- multiSelect: `false`
- options:
  - label: `"Rough references"` — description: `"Use as inspiration; DESIGN will produce its own"`
  - label: `"Detailed, use as-is"` — description: `"DESIGN should treat these as the wireframe source of truth"`

**Conditional follow-ups (fire only as needed after the batched call returns):**

- If Q5 returned `"Personal data"`:

  **Region fold check (Step 1.7 — `localeSignals` from `intake-agent` Call A).** Before firing the Region prompt, evaluate `inferredAnswers.localeSignals` from the scan results. Count how many of the four signals (`currency`, `phone`, `locale`, `address`) point at the **same** region ID, ignoring entries that are `"not found"`, `"ambiguous"`, or `"unknown"`:

  - **≥2 signals agree on one region AND no other signal contradicts** → **skip the Region prompt.** Record region as `[INFERRED]` in `assumptions.md` §1 with a source line, e.g., `"Region: South Africa (POPIA) — inferred from Vitality brand (locale) + R currency (currency) + +27 phone format (phone)"`. The user reviews and can correct at Gate 1.
  - **0–1 signals agree, or two signals disagree** → fire the drilldown unchanged.

  Drilldown (only when the fold check above does not fire):
  - header: `"Region"`
  - question: `"Where are your users located? (Determines which data protection law applies.)"`
  - options: `"EU/UK (GDPR)"` / `"South Africa (POPIA)"` / `"California (CCPA)"` / `"Multiple / not sure"`

- If Q5 returned nothing (empty multi-select) but keywords were detected, run the policy's confirmation: "Just to confirm — the app won't handle payment card data, personal information, health records, or data subject to industry regulations?" Use `AskUserQuestion` with `"Confirmed, no compliance"` / `"Actually, ..."`.

Capture as `complianceDomains: string[]` (e.g., `["pci-dss", "gdpr"]` or `[]`), `region: "ZA" | "UK" | "EU" | "US" | "CA" | "AU" | "IE" | "multiple" | null` (recorded whether asked or inferred), and `wireframeQuality: "rough" | "detailed" | null`.

**Do NOT ask per-domain follow-up questions inline.** The implementation details are emitted as `[INFERRED]` entries in `assumptions.md` §2 by `intake-agent` Call C; the user reviews them at Gate 1.

---

#### Step 4c: intake-agent Call B — Manifest

Launch `intake-agent` with prompt:
> "This is Call B — Manifest.
>
> Scan results from Call A: [paste]
>
> Onboarding path: [docs, prototype, or qa]
> Project description: [projectDescription text, or "N/A — user provided documentation files" if Option A/B]
>
> User answers (some may have been bulk-accepted from Mode 1 inferences, or auto-resolved from prototype sources at Step 4b-pre — treat them all the same as any other answer):
> 1. Roles template: [saas-standard|internal-tool|marketplace|editorial|custom]
>    Custom roles (if applicable): [list]
> 2. Styling/Branding: [user answer, or `from-prototype` if auto-resolved]
>    Styling source (auto-resolved only): [stylingSource value, e.g. `tokens.css` | `project.pen` | none]
> 3a. API Spec: [user's Q3a answer]
> 3b. Backend Readiness: [user's Q3b answer]
>    → dataSource: [existing-api|new-api|api-in-development|mock-only]
>    → specCompleteness: [complete|partial|none]
> 4. Authentication Method: [bff|frontend-only|custom]
> 4a. BFF Endpoints: login=[url], userinfo=[url], logout=[url] (only if BFF)
> 4b. Custom Auth Notes: [user's description] (only if custom)
> 5. Compliance Domains: [complianceDomains array, e.g., ["pci-dss", "gdpr"] or []]
> 6. Wireframe Quality: [rough | detailed | N/A]
>    Wireframe source (auto-resolved only): [`project.pen` | `prototype-src/` | none]
>
> Write the intake manifest to generated-docs/context/intake-manifest.json. Do NOT generate assumptions.md (that is Call C). Return a brief 'manifest written' confirmation. Do NOT commit. Do NOT use AskUserQuestion."

Proceed silently to Step 4d (v2 prototype) or 4e (otherwise) — the manifest is intermediate state; the Gate 1 review is the user-facing surface.

---

#### Step 4d: prototype-review-agent (v2 imports only)

**Skip this step entirely** if the scan results did NOT include `format: v2`. Proceed directly to Step 4e.

Launch `prototype-review-agent` with prompt:
> "Review the v2 prototype artifacts. The intake manifest is at generated-docs/context/intake-manifest.json. Catalogue the screens under documentation/prototype-src/ (per-screen `{ route, sourceFile, components, fields, validation, navigation, prototypeShortcuts }`), extract enrichments from genesis.md, flag prototype assumptions, cross-validate against OpenAPI specs, and pre-map genesis sections to FRS sections. Do NOT open documentation/project.pen — it is a designer artifact only. Do NOT export screenshots. Return structured PROTOTYPE REVIEW output. Do NOT use AskUserQuestion. Do NOT commit."

**After the agent returns:**

- **Do NOT present enrichments or flagged assumptions for individual accept/reject.** The agent's output is stored and passed to `intake-agent` Call C, which folds enrichments and flagged assumptions into `assumptions.md` §3 as `[INFERRED]` entries. The user reviews them in bulk at Gate 1.
- Store the full agent return (`prototypeCatalogue`, `sharedShell`, `enrichments`, `assumptionsFlagged`, `dataStructureMismatches`, `genesisToFrsMapping`, `sourceDocumentMapping`) for use in Step 4f and for `design-wireframe-agent` at DESIGN.

---

#### Step 4e: api-connectivity-agent Call B — Smoke Test (skip when dataSource is mock-only or new-api)

**Skip this step entirely** when `context.dataSource` in the intake manifest is `"mock-only"` or `"new-api"`, OR when the Step 4a Call A return reported an empty plan (no spec found). Output a single line — "Backend connectivity check skipped (dataSource=[value])." — and proceed to Step 4f.

Otherwise, run the smoke test using the plan from Step 4a Call A plus the user's checklist answers (auth method, BFF endpoints). Procedure per [api-connectivity-agent.md](../agents/api-connectivity-agent.md) and [authentication-intake.md § Backend API Auth](../policies/authentication-intake.md): up to 3 attempts (Call B + 2 × Call C), curl-fallback, Shape 1/2/3 persistence. The agent writes `context.backendConnectivity` and returns.

---

#### Step 4f: intake-agent Call C — Generate assumptions.md

Launch `intake-agent` with prompt:
> "This is Call C — Assumptions. The manifest at generated-docs/context/intake-manifest.json contains checklist context and (if applicable) context.backendConnectivity from Step 4e.
>
> [If v2 prototype review ran in Step 4d, append:]
> Prototype review output (fold into §3):
>   enrichments: [verbatim list]
>   assumptionsFlagged: [verbatim list]
>   dataStructureMismatches: [verbatim list]
>
> Generate generated-docs/specs/assumptions.md using the template at .claude/templates/assumptions.md per your Call C spec (§1 from manifest context, §2 defaults per styling-centralisation.md and compliance-intake.md, §3 inferred + smoke-test merge per smoke-test-auto-merge.md, §4 traceability). Return ASSUMPTIONS SUMMARY. Do NOT commit. Do NOT use AskUserQuestion."

The agent writes `assumptions.md` and returns a summary. Hold the summary for Step 4g.

---

#### Step 4g: Gate 1 — assumptions.md Approval

Follow the shared [Gate Approval Pattern](../shared/gate-approval-pattern.md) with these gate-specific parameters:

**gate_name:** `"Approve assumptions"`
**artifact_path:** `generated-docs/specs/assumptions.md`
**question:** `"Does this match what you intend to build?"`

**Summary template** (output as regular text *before* the `AskUserQuestion`, populated from Step 4f's `ASSUMPTIONS SUMMARY`):

```
Here's how I've interpreted your inputs so far — review and correct anything that's off:

**Critical decisions you confirmed:**
- Path: [onboarding path]
- Roles template: [rolesTemplate]
- Auth: [authMethod]
- Data source: [dataSource]
- Compliance domains: [complianceDomains or "None"]

**Defaulted assumptions (review carefully):**
[N entries] — e.g., styling defaults, NFR baseline, compliance implementation details

**Inferred assumptions (skim for accuracy):**
[M entries] — e.g., data model, workflows, permissions matrix seed, connectivity findings

[If applicable: Connectivity findings — verified Shape 2 / deferred Shape 3]

The full document is at `generated-docs/specs/assumptions.md`. Take a look before approving.

**Items that need your attention:**
[keyAssumptionsForUserAttention list from the agent]
```

**AUQ options:**
- `"Approve all"` — description: `"Use these assumptions as the basis for the FRS"`
- `"I have small changes"` — description: `"I'll describe deltas in my next message"`
- `"Let me edit the file directly"` — description: `"I'll open generated-docs/specs/assumptions.md and edit it"`
- `"Start over"` — description: `"The interpretation is fundamentally off — let me clarify the path and we'll re-run intake"`

**revise_call:** `intake-agent` Call D with feedback:
> "This is Call D — Revise. The user has these changes to generated-docs/specs/assumptions.md: [feedback OR 'edited file directly — re-read and validate' OR 'start-over overrides: [overrides]']. Apply the changes per your spec. If a Critical Decision changed, update the manifest accordingly. Return updated ASSUMPTIONS SUMMARY. Do NOT commit. Do NOT use AskUserQuestion."

**"Start over" branch:** Same as "I have small changes" but first ask plain-text: `"What should we change about the path or approach? For example: 'switch to guided Q&A', 'roles template is wrong, use marketplace', 'my docs were incomplete, here are more inputs'."` Then feed those overrides into Call D.

On approval, proceed to Step 4h.

---

#### Step 4h: intake-brd-review-agent Call A — Produce FRS

Launch `intake-brd-review-agent` with prompt:
> "This is Call A — Produce FRS. The user-approved assumptions.md is at generated-docs/specs/assumptions.md. The manifest is at generated-docs/context/intake-manifest.json (including context.backendConnectivity if populated).
>
> Translate the approved assumptions into the canonical Feature Requirements Specification. Use the template at .claude/templates/feature-requirements.md. Each [INFERRED] compliance entry in assumptions.md §2 becomes one CR-numbered constraint. Mirror context.backendConnectivity into the Backend Integration section per its shape. Persist requirementCount / businessRuleCount / nfrCount / complianceRequirementCount to the manifest.
>
> Return FRS SUMMARY. Do NOT commit yet. Do NOT use AskUserQuestion."

The agent returns an FRS summary. Hold it for Step 4i.

---

#### Step 4i: Gate 2 — FRS Approval

Follow the shared [Gate Approval Pattern](../shared/gate-approval-pattern.md) with these gate-specific parameters:

**gate_name:** `"Approve FRS"`
**artifact_path:** `generated-docs/specs/feature-requirements.md`
**question:** `"Does this capture everything we need to build?"`

**Summary template** (output as regular text *before* the `AskUserQuestion`, populated from Step 4h's `FRS SUMMARY`):

```
Here's the formal Feature Requirements Specification, derived from the assumptions you approved:

- Requirements: [N] (R1..R[N])
- Business rules: [M] (BR1..BR[M])
- Non-functional requirements: [P] (NFR1..NFR[P])
- Compliance requirements: [C] (CR1..CR[C])

Sections covered: [list]
Sections marked N/A: [list — usually only Compliance when no domains]

[If thinSections is non-empty: "Sections that translated thinly from your assumptions (worth a look): [list]"]

The full FRS is at `generated-docs/specs/feature-requirements.md`. Take a look before approving.
```

**AUQ options:**
- `"Approve all"` — description: `"FRS is correct — commit and move on to DESIGN"`
- `"I have small changes"` — description: `"I'll describe deltas in my next message"`
- `"Let me edit the file directly"` — description: ``"I'll open generated-docs/specs/feature-requirements.md and edit it"``

**Disposition gate** (only fires on "small changes" or "edit directly"): ask a second `AskUserQuestion`:
- header: `"Revision scope"`
- question: `"Is the underlying assumption wrong, or just how it's expressed in the FRS?"`
- options:
  - `"Just the FRS wording / structure"` — description: `"The assumption is right; the FRS text needs a tweak"`
  - `"The underlying assumption is wrong"` — description: `"Let me fix assumptions.md and we'll regenerate the FRS"`

**revise_call** (FRS-wording disposition): `intake-brd-review-agent` Call B with feedback:
> "This is Call B — Revise (disposition: FRS-wording). The user has these changes to generated-docs/specs/feature-requirements.md: [feedback OR 'edited file directly — re-read and validate']. Apply the changes, keep R/BR/NFR/CR numbering stable where possible, update traceability, re-amend manifest counts if they changed. Return updated FRS SUMMARY. Do NOT commit yet."

**Bounce-back** (assumption-wrong disposition, per gate-approval-pattern.md §Bounce-Back):
- Display: `"Got it — let's fix the assumption. I'll re-open assumptions.md so you can correct it, and we'll regenerate the FRS once the change is in."`
- Re-enter **Step 4g** with the user's feedback as `intake-agent` Call D input. After Gate 1 re-approval, return to **Step 4h** to regenerate the FRS, then re-enter Step 4i.

On approval, proceed to Step 4j.

---

#### Step 4j: intake-brd-review-agent Call B — Commit Bundle

Launch `intake-brd-review-agent` with prompt:
> "This is Call B — Finalize (disposition: approved). The user approved the FRS at Gate 2. Commit the full intake bundle (FRS, manifest, assumptions.md, smoke-test artifact if present, logs), run the state transition to DESIGN, and push. Return completion message. Do NOT use AskUserQuestion."

The agent commits, pushes, transitions phase, and returns a completion message. Proceed to Step 5.

---

### Step 5: INTAKE Complete — Context Clearing Boundary

After Step 4j returns, INTAKE is done. This is **clearing boundary #1**.

**Dashboard update (fire-and-forget):** Before instructing the user to clear, regenerate the HTML dashboard per the [Dashboard Update Policy](../shared/orchestrator-rules.md#dashboard-update-policy).

Tell the user (conversationally):

> "That wraps up requirements gathering — assumptions, the Feature Requirements Specification, and the intake manifest are all committed. Next up is the design phase.
>
> Run `/clear` then `/continue` when you're ready to move on."

**STOP** — do not launch the next agent.

---

## After INTAKE (Reference Only — Handled by /continue)

Your job in `/start` ends at the STOP above. Subsequent phases (DESIGN → SCOPE → STORIES → per-story REALIGN/TEST-DESIGN/WRITE-TESTS/IMPLEMENT/QA) are driven by `/continue`. See [continue.md](./continue.md) for resumption logic and [orchestrator-rules.md](../shared/orchestrator-rules.md#per-phase-scoped-call-prompts) for the full scoped-call patterns.
