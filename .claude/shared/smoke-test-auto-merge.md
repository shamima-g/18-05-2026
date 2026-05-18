# Smoke-Test Findings → `assumptions.md` Auto-Merge

This spec defines how the backend connectivity smoke test (run by `api-connectivity-agent` at INTAKE Step 4e) flows into `assumptions.md` §3 before Gate 1.

**Consumers:** `intake-agent` Call C (assumptions generation), reviewers wanting to understand the connectivity-to-assumptions pipeline.

---

## Why auto-merge?

Connectivity findings are real signals the user has already validated during Step 4e — re-asking them would be redundant. The merge happens **before** Gate 1 so the user sees them in context with all other inferred assumptions, and can correct any misinterpretation inline (e.g., "the CORS thing is fine because we use the proxy already, drop that NFR").

---

## Trigger Conditions

The merge runs whenever `intake-agent` is producing `assumptions.md` AND `intake-manifest.json` contains a populated `context.backendConnectivity` block. Three input shapes are possible (per [authentication-intake.md § Backend API Auth](../policies/authentication-intake.md)):

| Shape | `skipped` | `verifiedStatus` | What it means |
|---|---|---|---|
| Shape 1 | `true` | — | Connectivity check was skipped (`dataSource=mock-only` or `new-api`, or backend not running) — no merge needed; §3 connectivity sub-section is omitted |
| Shape 2 | `false` | 2xx number | Smoke test passed — full merge runs |
| Shape 3 | `false` | `null` | Smoke test attempted but unverified (3-attempt cap hit) — partial merge runs with deferred-verification entry |

---

## Mapping Rules

The mappings below define **which `[INFERRED]` or `[DEFAULT]` entry to emit** in `assumptions.md` §3 (Backend Connectivity Findings sub-section). Each row corresponds to a distinct signal in `context.backendConnectivity`.

| Signal | Detection | Entry to emit |
|---|---|---|
| **Shape 2 success** | `skipped === false && smokeTest.verifiedStatus` between 200–299 | `` - `[INFERRED]` Backend reachable at `<baseUrl>` with `<authScheme>` auth — verified `<verifiedAt>` `` |
| **Shape 2 + CORS warning** | Shape 2 success AND (`corsWarning === true` OR `notes` matches `/CORS|cross-origin|allow-origin/i`) | `` - `[INFERRED]` NFR candidate: Next.js rewrite proxy required (CORS headers absent on backend for `localhost:3000`) `` |
| **Shape 3 unverified** | `skipped === false && smokeTest.verifiedStatus === null` | `` - `[INFERRED]` Backend connectivity deferred — `<warning verbatim>`; re-run via `/api-status` after fixing `` |
| **404 on spec-declared endpoint** | Shape 3 AND `smokeTest.lastError` matches `/\b404\b/` AND `sourceMethod === "spec"` | `` - `[DEFAULT]` `dataSource` may need reclassification to `api-in-development` — the spec lists `<endpoint>` but the backend returned 404. Confirm during Gate 1 (flips on mock layer if changed). `` |
| **Auth-scheme mismatch** | `authScheme` does not align with `context.authMethod` per the alignment table below | `` - `[DEFAULT]` Backend uses `<scheme>` auth; user-facing auth is `<authMethod>`. Verify these layer correctly (e.g., BFF cookie + bearer to upstream API). `` |
| **VPN / proxy / internal network** | `notes` matches `/VPN|proxy|internal network|intranet/i` | `` - `[INFERRED]` NFR candidate: dev environment requires `<notes excerpt>` `` |
| **Curl-fallback used** | `sourceMethod === "user_curl"` (Shape 2 or Shape 3) | `` - `[INFERRED]` Smoke test driven by a user-pasted curl example — captured in `intake-manifest.json` `context.backendConnectivity.userCurlExample` `` |
| **Credentials redacted in fallback** | `redactedLiteralsDetected === true` (signalled in agent return, recorded in manifest at merge time) | `` - `[INFERRED]` Rotation reminder: literal credentials were redacted from a pasted curl during Step 4e. Rotate `<credentialEnvVars>` at your earliest convenience (originals are in `.claude/logs/*.md` which is committed). `` |

### Auth-scheme alignment table

For the "Auth-scheme mismatch" rule above. The match is **fuzzy** — schemes are compatible if they belong to the same row.

| `context.authMethod` | Compatible `backendConnectivity.authScheme` values | Mismatch examples |
|---|---|---|
| `bff` | `cookie`, `none`, any scheme behind the BFF (bearer / apiKey / oauth2-client-creds are all valid upstream) | None — BFF intentionally layers; surface as informational only when the upstream scheme is unusual |
| `frontend-only` | `none`, `bearer` (if next-auth attaches it), `cookie` | A backend requiring `apiKey` while user-facing auth is `frontend-only` likely indicates a layering misconfiguration — flag it |
| `custom` | Any | No mismatch — user's custom flow is opaque |

When a row's compatible set fully contains the observed scheme, no mismatch entry is emitted. Otherwise emit the mismatch entry above.

---

## Algorithm (Pseudocode)

```js
function mergeConnectivityIntoAssumptions(manifest, assumptionsDoc) {
  const conn = manifest.context.backendConnectivity;

  // Shape 1 — nothing to merge
  if (!conn || conn.skipped === true) {
    return assumptionsDoc;  // §3 connectivity sub-section omitted
  }

  const entries = [];
  const verified = conn.smokeTest?.verifiedStatus;
  const isShape2 = typeof verified === "number" && verified >= 200 && verified < 300;
  const isShape3 = verified === null;

  // Shape 2 success
  if (isShape2) {
    entries.push(`[INFERRED] Backend reachable at \`${conn.baseUrl}\` with \`${conn.authScheme}\` auth — verified ${conn.smokeTest.verifiedAt}`);
  }

  // Shape 3 unverified
  if (isShape3) {
    entries.push(`[INFERRED] Backend connectivity deferred — ${conn.warning}; re-run via /api-status after fixing`);
  }

  // CORS
  const corsHit = conn.corsWarning === true || /CORS|cross-origin|allow-origin/i.test(conn.notes ?? "");
  if (isShape2 && corsHit) {
    entries.push(`[INFERRED] NFR candidate: Next.js rewrite proxy required (CORS headers absent on backend for localhost:3000)`);
  }

  // 404 on spec endpoint
  const lastError = conn.smokeTest?.lastError ?? "";
  if (isShape3 && /\b404\b/.test(lastError) && conn.sourceMethod === "spec") {
    entries.push(`[DEFAULT] \`dataSource\` may need reclassification to \`api-in-development\` — the spec lists \`${conn.smokeTest.endpoint}\` but the backend returned 404. Confirm during Gate 1 (flips on mock layer if changed).`);
  }

  // Auth-scheme mismatch
  const mismatch = detectAuthMismatch(manifest.context.authMethod, conn.authScheme);
  if (mismatch) {
    entries.push(`[DEFAULT] Backend uses \`${conn.authScheme}\` auth; user-facing auth is \`${manifest.context.authMethod}\`. Verify these layer correctly (e.g., BFF cookie + bearer to upstream API).`);
  }

  // VPN / proxy / internal network
  if (/VPN|proxy|internal network|intranet/i.test(conn.notes ?? "")) {
    const note = conn.notes.replace(/\s+/g, " ").trim();
    entries.push(`[INFERRED] NFR candidate: dev environment requires ${note}`);
  }

  // Curl-fallback used
  if (conn.sourceMethod === "user_curl") {
    entries.push(`[INFERRED] Smoke test driven by a user-pasted curl example — captured in \`intake-manifest.json\` \`context.backendConnectivity.userCurlExample\``);
  }

  // Rotation reminder
  if (conn.redactedLiteralsDetected === true) {
    const vars = (conn.credentialEnvVars ?? []).join(", ");
    entries.push(`[INFERRED] Rotation reminder: literal credentials were redacted from a pasted curl during Step 4e. Rotate \`${vars}\` at your earliest convenience (originals are in \`.claude/logs/*.md\` which is committed).`);
  }

  return injectConnectivityEntries(assumptionsDoc, entries);
}

function detectAuthMismatch(authMethod, authScheme) {
  // Ambiguous scheme — agent couldn't resolve, so we can't claim a mismatch
  if (authScheme === "mixed" || authScheme === "unknown") return false;

  const compatible = {
    bff: new Set(["cookie", "none", "bearer", "apiKey", "oauth2-client-creds", "basic"]),
    "frontend-only": new Set(["none", "bearer", "cookie"]),
    custom: null, // any — no mismatch
  };
  const set = compatible[authMethod];
  if (set === null || set === undefined) return false;
  return !set.has(authScheme);
}
```

### Notes on the algorithm

- `injectConnectivityEntries` inserts the entries under `assumptions.md` §3 "Backend Connectivity Findings" sub-section. If the list is empty, the sub-section is omitted entirely.
- The merge is **idempotent** — re-running it against an already-merged document produces the same output (the agent overwrites the connectivity sub-section, not appends to it).
- Source traceability (§4 of `assumptions.md`) gets a single row covering the merge: `§3.connectivity.* | [INFERRED] | intake-manifest.json | context.backendConnectivity`.

---

## Order of Operations in `intake-agent` Call C

1. Read the manifest (already populated by Call B and the api-connectivity-agent's Call B in Step 4e — `context.backendConnectivity` is present unless connectivity was skipped)
2. Receive prototype review output from the orchestrator (v2 runs only — passed via the Call C prompt)
3. Build `assumptions.md` §1 (Critical Decisions) from `context.*` fields in the manifest
4. Build `assumptions.md` §2 (Defaulted & Domain-Inferred Assumptions) — styling (defaults or prototype-inferred), compliance domain inferences (per `compliance-intake.md`), NFR defaults
5. Build `assumptions.md` §3 (Inferred Assumptions) — data model, workflows, permissions seed
6. **Run the merge algorithm above** to append §3 Backend Connectivity Findings entries
7. Build `assumptions.md` §4 (Source Traceability)
8. Write `assumptions.md` to `generated-docs/specs/assumptions.md`
9. Return human-readable summary for the orchestrator's Gate 1 display step

---

## Gate 1 Edit Semantics

When the user edits a connectivity-derived assumption during Gate 1:

- **Striking the entry** → the entry is removed from `assumptions.md` but `context.backendConnectivity` in the manifest is unchanged. The user has rejected the **interpretation**, not the underlying data.
- **Editing the text** → the modified version is what flows into the FRS. The manifest still holds the raw connectivity result.
- **Bouncing back to assumptions because the FRS got it wrong** (Gate 2 → Gate 1) → the user re-edits, the agent re-runs the FRS generation. The merge algorithm runs again, but the user's prior edits to connectivity entries are preserved (the merge re-emits the rules-based entries; user edits on top of them are preserved by a 3-way merge against the prior `assumptions.md`).

---

## Testing the Merge (forward-looking — not yet implemented)

When the algorithm is implemented in `.claude/scripts/smoke-test-merge.js`, a unit-testable harness should accompany it at `.claude/scripts/smoke-test-merge.tests.js`. Each row in the mapping table above maps to a test case:

- Shape 1 input → empty connectivity sub-section
- Shape 2 (clean) → single "reachable" entry
- Shape 2 + CORS → "reachable" + NFR candidate
- Shape 3 (404 + spec) → deferred + reclassification suggestion
- Shape 3 + auth mismatch + VPN → multiple entries
- `sourceMethod=user_curl` with `redactedLiteralsDetected=true` → fallback + rotation entries

The merge function should be importable for these tests without invoking the agent.
