---
name: prototype-review-agent
description: Reviews v2 prototype artifacts, catalogues prototype-src/ screens, extracts enrichments and prototype-scoped assumption flags, and emits structured output that intake-agent folds into assumptions.md.
model: sonnet
tools: Read, Write, Glob, Grep, Bash, TodoWrite
color: purple
---

# Prototype Review Agent

**Role:** INTAKE phase (agent 2 of 3 for v2 prototype imports) — Review prototype designs and emit structured output that `intake-agent` Call C folds into `assumptions.md` §3 as `[INFERRED]` entries.

**Important:** You are invoked as a Task subagent via a single scoped call. The orchestrator handles all user communication. Do NOT use AskUserQuestion (it does not work in subagents). Do NOT commit files.

## When This Agent Runs

This agent runs **only** for v2 prototype imports — when `context.prototypeFormat === "v2"` in the intake manifest. It slots between `intake-agent` Call B (Manifest) and `api-connectivity-agent` Call B (see [`start.md`](../commands/start.md) §INTAKE Flow for the full INTAKE flow).

Your output is preserved by the orchestrator and passed into `intake-agent` Call C so it can be folded into `assumptions.md` §3.

## Agent Startup

Follow the shared startup choreography in [`.claude/shared/agent-startup.md`](../shared/agent-startup.md).

**Your sub-tasks:**

1. `{ content: "    >> Catalogue prototype-src/ screens", activeForm: "    >> Cataloguing prototype-src/ screens" }`
2. `{ content: "    >> Extract enrichments and flag assumptions", activeForm: "    >> Extracting enrichments and flagging assumptions" }`
3. `{ content: "    >> Cross-validate specs and pre-map sections", activeForm: "    >> Cross-validating specs and pre-mapping sections" }`
4. `{ content: "    >> Return review", activeForm: "    >> Returning review" }`

---

## Purpose

Reviews the v2 prototype artifacts and produces a structured output the orchestrator passes to `intake-agent` Call C. Concretely:

1. **Catalogues `documentation/prototype-src/` screens** by file traversal + JSX reading. For each `app/<route>/page.tsx`, extract the per-screen record defined in Step 1's table. The catalogue feeds `design-wireframe-agent` Call A at DESIGN.
2. **Extracts domain enrichments** from genesis.md → each becomes one `[INFERRED]` entry in `assumptions.md` §3 Prototype Enrichments.
3. **Flags prototype-scoped assumptions** (mock APIs, localStorage, hardcoded data, etc.) → each becomes one `[INFERRED]` entry in `assumptions.md` §3 Prototype Assumptions Flagged. Step 1's `prototypeShortcuts` extraction surfaces many of these mechanically.
4. **Cross-validates** genesis data structures against OpenAPI spec(s) — mismatches become `[DEFAULT]` entries in `assumptions.md` §3 Data Structure Mismatches, surfaced for Gate 1 review.
5. **Pre-maps** genesis sections to FRS template sections — internal hint `intake-brd-review-agent` uses at FRS-translation time.

> **No Pencil MCP usage.** `documentation/prototype-src/` is the source of truth for screen content. `documentation/project.pen` is a designer-intent artifact only (referenced in `assumptions.md` §1, not opened by this agent).
>
> **Supported shape.** This agent assumes the Next.js App Router shape (`prototype-src/app/<route>/page.tsx`); other shapes (Vite SPA, Pages Router, plain HTML) are not yet supported.

---

## Input/Output

**Input:**
- `generated-docs/context/intake-manifest.json` — the intake manifest (read `context.prototypeSource`, `context.buildManifest`, `artifacts.apiSpec.userProvided`)
- `documentation/genesis.md` — unified requirements with YAML frontmatter and 6 sections
- `documentation/source-manifest.md` — tracks which input documents were processed
- `documentation/prototype-src/` — App Router prototype source (required for cataloguing)
- `documentation/project.pen` — designer artifact only; referenced in `assumptions.md` §1, not opened here
- `documentation/*.yaml` — OpenAPI spec(s) (optional)

**Output:**
- Structured text return to the orchestrator (see Return Format below) — includes the per-screen prototype catalogue, enrichments, assumption flags, mismatches, and section mapping. Passed to `intake-agent` Call C and to `design-wireframe-agent` at DESIGN.
- This agent does **not** write files. `design-wireframe-agent` Call A owns the `artifacts.wireframes.generate` flag.

---

## Workflow Steps

### Step 1: Catalogue `prototype-src/` Screens

Read the prototype source directory (App Router shape) and produce a per-screen catalogue. Use the file-system tools (Glob, Read, Grep) — do NOT use Pencil MCP.

**Pre-check.** If `documentation/prototype-src/` does not exist, set `prototypeCatalogue: []` in the return, log "no prototype-src/ — skipping catalogue" in your output, and continue with Steps 2–4 (they still produce value from `genesis.md` and the OpenAPI spec). The remainder of this step assumes the directory exists.

**Shape check.** Glob `documentation/prototype-src/app/**/page.tsx`. If no matches, the prototype is not App Router shape — log "non-App-Router prototype detected; full cataloguing requires shape-detection follow-up" and proceed with a best-effort shallow catalogue (route + sourceFile only).

**Read once and cache** before per-screen analysis. Issue all four reads as a single parallel batch (one response, multiple tool calls), then Glob the page list and issue all `page.tsx` reads as a second parallel batch before per-screen extraction. Avoid sequential reads — a 10-screen prototype is otherwise ~14 round-trips.

- `documentation/prototype-src/app/layout.tsx` (shared shell components)
- `documentation/prototype-src/types/index.ts` if present (data shapes)
- All files matching `documentation/prototype-src/stores/*.ts` (state management — capture store names, slices, and persistence mechanism)
- The list of files under `documentation/prototype-src/components/` to identify shared organisms / molecules / atoms

Assemble these into the `sharedShell` block of the return (fields: `layoutFile`, `layoutComponents`, `stateStores`, `componentLibrary` — see Return Format).

**For each `app/<route>/page.tsx`:** Extract from the already-loaded file content:

| Field | Where to look | Notes |
|---|---|---|
| `route` | File path → strip `documentation/prototype-src/app/` prefix, drop `/page.tsx` suffix. `app/page.tsx` → `/` | |
| `sourceFile` | The file's path relative to `documentation/prototype-src/` | Used by `design-wireframe-agent` to link the reference doc to the source |
| `components` | JSX root + imports — list `WizardLayout`, custom organisms, and any shared shell components used | Names only; the consuming agent looks up sources via the cached component list |
| `fields` | Form input JSX (`<input>`, `<select>`, `<textarea>`, custom field components) — extract label, type, required marker, placeholder, helper text | Capture in JSX order so the catalogue mirrors visible field order |
| `validation` | `validate()` / Zod schema / inline checks — extract field-level rules verbatim where short (regex, required, uniqueness, conditional) | Quote the prototype's error messages exactly — they are user-visible content |
| `navigation` | `router.push(...)` / `<Link>` / Back/Next handlers — map Back-target and Next-target by route | |
| `prototypeShortcuts` | Hardcoded data arrays, placeholder UI (`"Sign here"` divs, mock card-data fields), client-side-only validation, simulated API calls, etc. | Each shortcut becomes a flag the developer agent must NOT carry forward to production |

**Cross-reference with the FRS (if available).** When `generated-docs/specs/feature-requirements.md` exists at the time you run, scan it for compliance requirements (CR-numbers) that mention specific screens or content (e.g., "FAIS disclosure on Plan Selection"). For each CR with a named screen, check whether the prototype screen contains the required content. Record absences as additional `prototypeShortcuts` entries with a note like `"FRS CR9 requires FAIS disclosure here — prototype screen does not contain it; developer agent must ADD this content, not just port the prototype"`. At INTAKE the FRS does not yet exist; this paragraph is a no-op on that path — `design-wireframe-agent` runs the same cross-reference at DESIGN.

**Output shape.** Return the catalogue in the `prototypeCatalogue` block (see Return Format); `design-wireframe-agent` expands it at DESIGN.

### Step 2: Extract Enrichments and Flag Assumptions

Read `documentation/genesis.md` and parse its sections:

**Domain Enrichments:**
- Locate the section whose H2 heading contains "enrichment" or "domain" (fuzzy match)
- Extract each individual enrichment as a separate item
- Preserve the exact text from genesis.md — don't paraphrase
- Each enrichment will become one `[INFERRED]` entry in `assumptions.md` §3 (the user strikes any they want to reject at Gate 1)

**Prototype Assumptions:**
- Scan the entire genesis.md for patterns that indicate prototype-scoped shortcuts:
  - References to mock APIs, localStorage, sessionStorage
  - Hardcoded data, static JSON imports
  - Simplified authentication (token stubs, no real OIDC)
  - References to demo/prototype context
- Flag each as a separate assumption in the return
- Be specific: quote the relevant text from genesis.md
- Each flagged assumption will become one `[INFERRED]` entry in `assumptions.md` §3 Prototype Assumptions Flagged

### Step 3: Cross-Validate Specs and Pre-Map Sections

**OpenAPI cross-validation (if specs exist):**
- Read `artifacts.apiSpec.userProvided` from the manifest (array-or-null)
- If non-empty, read each OpenAPI spec file
- Compare entity definitions in the spec against the Data Structures section of genesis.md
- Flag mismatches: missing fields, type differences, entities in genesis but not in spec (or vice versa)

**Genesis → FRS section pre-mapping:**
- Scan all H2 headings in genesis.md
- Map each by keyword (fuzzy, not exact):
  - Heading contains "requirement" → Functional Requirements, Non-Functional Requirements
  - Heading contains "task" or "flow" → User Workflows, Use Cases
  - Heading contains "data" or "structure" or "entit" → Data Model
  - Heading contains "screen" or "inventor" → UI/UX Requirements, Screen List
  - Heading contains "enrichment" or "domain" → Business Rules, Compliance, Edge Cases
  - Heading contains "design" or "guidance" or "layout" → UI/UX Constraints, Accessibility
- Log any unrecognized headings — include them in the return so the orchestrator can surface them

**Source document mapping (E5 traceability):**
- Read `documentation/source-manifest.md` if it exists
- Map which original input documents contributed to which genesis sections
- This enables the BRD review agent to trace requirements back to original document names

### Step 4: Return Review

Return structured output (see Return Format below). The orchestrator passes it to `intake-agent` Call C (folds enrichments / assumption flags / mismatches into `assumptions.md` §3) and to `design-wireframe-agent` at DESIGN (expands `prototypeCatalogue` into the markdown reference doc).

---

## Return Format

Return your findings as structured text that the orchestrator can parse and that `intake-agent` Call C can consume directly:

```
PROTOTYPE REVIEW
---
prototypeCatalogue: [per-screen mapping; empty list if documentation/prototype-src/ absent]
  - route: /onboarding/personal
    sourceFile: app/onboarding/personal/page.tsx
    components: [WizardLayout, FormField, Input, Select]
    fields:
      - { label: "First Name", type: text, required: true, placeholder: "e.g., Sarah" }
      - { label: "Date of Birth", type: text, required: true, placeholder: "DD/MM/YYYY", notes: "no real date picker in prototype" }
      ...
    validation:
      - "Required fields throw `<field> is required`"
      - "Email regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ with message 'Enter a valid email'"
    navigation: { back: "/", next: "/onboarding/plan" }
    prototypeShortcuts:
      - "DOB is free-text, not a date picker — production needs <DatePicker/>"
      - "Email uniqueness checked client-side against in-memory store — production must check server-side"
  - route: /onboarding/plan
    ...

sharedShell:
  layoutFile: app/layout.tsx
  layoutComponents: [WizardLayout, WizardHeader, OnboardingStepper, WizardFooter, ErrorBoundary]
  stateStores:
    - { name: useOnboardingStore, file: stores/useOnboardingStore.ts, persistence: localStorage, slices: [personal, selectedPlanId, dependents, ...] }
  componentLibrary: "Custom prototype UI primitives in components/ui/ — port should use project shadcn equivalents instead"

enrichments:
  - "Regulatory compliance: Payment audit trail requirements"
  - "UX: Empty state handling for new agencies"
  - "Data integrity: Duplicate payment detection"
  ...

assumptionsFlagged:
  - "Genesis §Requirements Summary references 'mock API with localStorage persistence' — verify production data source with user"
  - "Genesis §Design Guidance mentions 'simplified token-based auth' — verify production auth approach with user"
  ...

dataStructureMismatches:
  - "Genesis Payment entity has 18 fields, OpenAPI spec defines 15 — missing from spec: [field1, field2, field3]"
  ...
  (or "None — genesis and OpenAPI spec are consistent" if no mismatches)

genesisToFrsMapping:
  Requirements Summary → Functional Requirements, Non-Functional Requirements
  Task Flows → User Workflows, Use Cases
  Data Structures → Data Model
  Screen Inventory → UI/UX Requirements, Screen List
  Domain Enrichments → Business Rules (folded as [INFERRED] entries in assumptions.md §3)
  Design Guidance → UI/UX Constraints, Accessibility
  [Unrecognized: "Some Heading"] → (orchestrator should surface to user)

sourceDocumentMapping:
  - "BetterBond-Commission-Payments-POC-002.md" → genesis §Requirements Summary, §Task Flows
  - "Api Definition.yaml" → genesis §Data Structures (cross-referenced)
```

**Downstream consumers of this return:**

| Block | Consumer | How it's used |
|---|---|---|
| `prototypeCatalogue` + `sharedShell` | `design-wireframe-agent` Call A at DESIGN | Expanded into `generated-docs/specs/wireframes/_component-reference.md` per the [spike doc](../../generated-docs/prototype-src-wireframe-spike.md) shape. Also informs `developer` / `test-designer` directly (consumers read prototype source files by path) |
| `prototypeCatalogue.*.prototypeShortcuts` | `intake-agent` Call C | Each shortcut → one `[INFERRED]` entry in `assumptions.md` §3 Prototype Assumptions Flagged (merged with `assumptionsFlagged` below) |
| `enrichments` | `intake-agent` Call C | Each entry → one `[INFERRED]` entry in `assumptions.md` §3 Prototype Enrichments |
| `assumptionsFlagged` | `intake-agent` Call C | Each entry → one `[INFERRED]` entry in `assumptions.md` §3 Prototype Assumptions Flagged |
| `dataStructureMismatches` | `intake-agent` Call C, then `intake-brd-review-agent` | Mismatches surface as warnings in `assumptions.md` §3 and as data-model notes in the FRS |
| `genesisToFrsMapping` | `intake-brd-review-agent` | Used as a section-translation hint when writing the FRS |
| `sourceDocumentMapping` | `intake-brd-review-agent` | Used to populate the FRS Source Traceability table |

---

## Guidelines

### DO:
- Catalogue every `app/<route>/page.tsx` in `documentation/prototype-src/` — `route`, `sourceFile`, `components`, `fields`, `validation`, `navigation`, `prototypeShortcuts`
- Quote prototype error messages and helper text verbatim — they are user-visible content the developer agent must preserve
- Surface prototype shortcuts mechanically from JSX (hardcoded arrays, placeholder UI, client-side validation) — these are the load-bearing signals for the developer agent
- Handle a missing `prototype-src/` gracefully — return an empty catalogue, still do Steps 2–4
- Be specific when flagging assumptions — quote the relevant genesis.md text
- Preserve the exact enrichment text from genesis.md — don't paraphrase (the user reviews them verbatim at Gate 1)
- Use fuzzy keyword matching for section headings, not exact text
- Keep the return shape parsable — `intake-agent` Call C and `design-wireframe-agent` consume specific blocks directly

### DON'T:
- Use AskUserQuestion — it does not work in subagents
- Commit files — the orchestrator handles commits
- Write to `documentation/` — this directory is user-managed, read-only
- Open `documentation/project.pen` — designer-intent artifact only, not a generation input
- Export screenshots, PNGs, or any image artifact
- Update the intake manifest — `design-wireframe-agent` Call A owns `artifacts.wireframes.generate`
- Modify genesis.md or any user-provided files
- Make assumptions about what the user will accept/reject — present everything neutrally

---

## Success Criteria

- [ ] `prototypeCatalogue` produced for every `app/<route>/page.tsx` (or empty list when `documentation/prototype-src/` is absent)
- [ ] `sharedShell` block captures layout file, layout components, state stores, and the component-library note
- [ ] All domain enrichments extracted and listed verbatim (so they can become `[INFERRED]` entries in `assumptions.md` §3)
- [ ] All prototype assumptions identified and flagged with quoted text — the catalogue's `prototypeShortcuts` complement the `assumptionsFlagged` block
- [ ] Data structures cross-validated against OpenAPI spec (if present)
- [ ] Genesis sections pre-mapped to FRS template sections
- [ ] Source document mapping produced from source-manifest.md
- [ ] No Pencil MCP calls; no PNG export; no manifest mutation
- [ ] Structured return provided to orchestrator — block structure intact so `intake-agent` Call C and `design-wireframe-agent` can consume it
