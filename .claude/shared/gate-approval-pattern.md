# Gate Approval Pattern

Shared display-then-ask-then-revise pattern used by INTAKE Gates 1 and 2 (and any future gates that approve a generated document). Both gates use the same shape — the caller fills in three parameters and any gate-specific branches.

## Parameters Each Caller Provides

| Parameter | Description | Example (Gate 1) | Example (Gate 2) |
|---|---|---|---|
| `<gate_name>` | Short label for AUQ headers | "Approve assumptions" | "Approve FRS" |
| `<artifact_path>` | Path to the file under review | `generated-docs/specs/assumptions.md` | `generated-docs/specs/feature-requirements.md` |
| `<summary_template>` | Inline template for the summary text shown to the user | see Gate 1 summary in `start.md` | see Gate 2 summary in `start.md` |
| `<revise_call>` | Subagent prompt for applying free-text or direct-edit revisions | `intake-agent` Call D | `intake-brd-review-agent` Call B (disposition: FRS-wording) |
| `<bounce_back?>` | Optional — extra disposition that routes to a different gate | n/a | "underlying assumption is wrong" → route to Gate 1 |

---

## The Pattern

### Step 1 — Display the summary (MANDATORY)

Output `<summary_template>`, populated with the agent's return data, as **regular conversation text** *before* calling `AskUserQuestion`. Never embed the summary inside the question text.

> **Critical:** The user cannot approve what they haven't seen. If the agent's return summary is empty or unclear, read `<artifact_path>` directly and construct the summary yourself. Explicit display is mandatory — this is the most-violated step.

End the summary text with a single line: ``The full document is at `<artifact_path>`. Take a look before approving.``

### Step 2 — Ask for approval (ONLY after step 1 text is output)

Call `AskUserQuestion`:
- header: `"<gate_name>"`
- question: caller-specific (e.g., "Does this match what you intend to build?")
- options (3 base + 1 optional bounce-back):
  - `"Approve all"` — description: caller-specific approval action
  - `"I have small changes"` — description: `"I'll describe deltas in my next message"`
  - `"Let me edit the file directly"` — description: ``"I'll open <artifact_path> and edit it"``
  - *(Gate 2 only)* `"Start over"` or `"The underlying assumption is wrong"` — see Bounce-Back below

### Step 3 — Branch on the response

- **Approve all** → proceed past the gate.

- **I have small changes** → ask plain-text: `"Describe your changes — I'll apply them and show you the diff before committing."` Launch `<revise_call>` with the user's feedback. After it returns, display the diff (`git diff <artifact_path>`) and re-ask: ``"Look right?"`` (`AskUserQuestion`: `"Yes, approve"` / `"More changes"` / `"Let me edit the file directly"`).
  - "Yes, approve" → proceed past the gate
  - "More changes" → loop once more (2-round cap, then force-route to "Let me edit the file directly")
  - "Let me edit the file directly" → see next branch

- **Let me edit the file directly** → tell the user: ``"Open <artifact_path>, make your edits, and tell me when you're done."`` Wait for the user to signal "done". Re-read the file, display the diff, run `<revise_call>` with a "user edited directly — re-read and validate" hint. Re-display the updated summary; re-ask: `"Approve"` / `"More changes"`. Loop until approved.

- **(Bounce-back, if defined)** → see Bounce-Back below.

Loop the branches above until the user approves. Then exit the gate.

---

## Free-Text Revision Cap

The free-text delta loop is capped at **2 rounds**. If the user is still not approving after round 2, force-route to "Let me edit the file directly" — at that point the contradictions are too dense for the agent to resolve from prose alone.

## Bounce-Back (Gate 2 only)

When the user's revision is "the underlying assumption is wrong" rather than "FRS wording is wrong", route the revision to the earlier gate's revise call instead of the current gate's:

1. Display: ``"Got it — let's fix the assumption. I'll re-open <earlier_artifact_path> so you can correct it, and we'll regenerate <current_artifact_path> once the change is in."``
2. Re-enter the earlier gate with the user's feedback as input.
3. After earlier-gate re-approval, regenerate the current artifact and re-enter the current gate.

For Gate 2 → Gate 1 specifically: earlier artifact is `assumptions.md`, revise call is `intake-agent` Call D, regenerate via `intake-brd-review-agent` Call A.

---

## Why This Is Shared

Both gates ran near-identical display-then-ask loops with copy-pasted boilerplate. Differences are in summary content and revise-call identity — both clean parameters. Centralising the pattern prevents drift (e.g., one gate gaining a 3rd revision round while the other stays at 2) and keeps the user-facing flow uniform.
