# Roles Template Registry

This file is the single source of truth for the pre-built roles templates used by the redesigned INTAKE phase. The user selects a template at INTAKE; `design-roles-agent` expands the selected template into a full permissions matrix during DESIGN.

**Consumers:**
- `intake-agent` — presents the template list as a blocking question, captures the selection into `assumptions.md` §1
- `design-roles-agent` (DESIGN phase) — reads the selection from the manifest, generates the full matrix, surfaces it for user sign-off, persists to `generated-docs/specs/permissions-matrix.md`
- `feature-planner` (SCOPE / STORIES) — **future**: will read `permissions-matrix.md` so every story applies the correct role gates. **Today** it derives role gating from `context.rolesTemplate` + `context.customRoles` (the seed inputs), not the signed-off matrix. See [intake-redesign-plan.md § Out of Scope](../../generated-docs/intake-redesign-plan.md) "Permissions matrix consumer wiring" for the deferred workstream.

**Filename contract:**
- Selection stored at: `assumptions.md` §1 (Critical Decisions table, "Roles template" row) and `intake-manifest.json` `context.rolesTemplate`
- Permissions matrix produced at: `generated-docs/specs/permissions-matrix.md` (signed-off output of `design-roles-agent`)

---

## Template Registry

| ID | Display name | Roles (ordered most → least privileged) | Typical fit |
|---|---|---|---|
| `saas-standard` | SaaS Standard | Owner → Admin → Member → Viewer | Multi-tenant SaaS apps where billing/ownership is distinct from administrative access |
| `internal-tool` | Internal Tool | Admin → User | Back-office tools, internal dashboards, anything that doesn't need a viewer tier |
| `marketplace` | Marketplace | Moderator → Seller → Buyer | Two-sided platforms — separate roles for supply, demand, and oversight |
| `editorial` | Editorial | Editor → Author → Contributor → Reader | Content management, publishing, document workflows |
| `custom` | Custom (free-text) | — | None of the above fits cleanly; user provides role names inline via AUQ's auto-"Other" free-text affordance (not an explicit option in the AUQ list) |

### Selection Mechanics (at INTAKE)

The `intake-agent` (Call A inference + Call B manifest write) and the orchestrator's checklist question handle template selection as follows:

1. **Inference (Mode 1 only):** If `documentation/` mentions specific role names, the agent attempts to map them to a template and pre-tick that option. Example mappings:
   - "admin", "user" → `internal-tool`
   - "owner", "admin", "member", "viewer" → `saas-standard`
   - "broker", "viewer", "admin" → `saas-standard` (closest standard fit; user can edit role names at DESIGN)
   - "buyer", "seller", "moderator" → `marketplace`
   - "editor", "author", "reader" → `editorial`
   - Anything else → `custom`
2. **Selection:** `AskUserQuestion` presents the **four explicit templates** (SaaS Standard / Internal Tool / Marketplace / Editorial). The `custom` template is reached via AUQ's automatic "Other" free-text affordance — do **not** list "Custom" as an explicit option (the AUQ tool description forbids it).
3. **Silent accept on the four explicit templates:** When the user picks SaaS Standard / Internal Tool / Marketplace / Editorial, the orchestrator silently accepts the canonical role list from the registry above — no drilldown, no follow-up prompt. A one-line plain-text acknowledgement reassures the user that tweaks are still possible: _"Captured: &lt;roles list&gt;. You can refine these in assumptions.md at Gate 1, or adjust the full permissions matrix at DESIGN."_
4. **Custom path:** When the user picks the auto-"Other" affordance, the free-text role list arrives in the same AUQ response (no separate prompt). Capture as `context.customRoles: string[]` (split on newlines or commas; trim whitespace).

The selection is recorded in §1 of `assumptions.md` and as `context.rolesTemplate` in the manifest. The user does NOT review the full permissions matrix at INTAKE — that is `design-roles-agent`'s job. Refinements to the captured role list (e.g., renaming "Member" to "Broker") happen in `assumptions.md` §1 at Gate 1, before BRD generation.

---

## Default Permissions Matrices

Each template's default matrix below is the **seed** that `design-roles-agent` uses as the starting point in DESIGN. The user can edit any cell during DESIGN sign-off; the seed exists so the matrix is reviewable, not generated from scratch.

Conventions:
- `✓` — permission granted
- (blank) — permission denied
- `~` — conditional grant (the design-roles-agent will surface the condition as a footnote and ask the user to confirm)

### `saas-standard`

| Permission | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| View main dashboard | ✓ | ✓ | ✓ | ✓ |
| View shared content | ✓ | ✓ | ✓ | ✓ |
| Create content | ✓ | ✓ | ✓ | |
| Edit own content | ✓ | ✓ | ✓ | |
| Edit any content | ✓ | ✓ | | |
| Delete content | ✓ | ✓ | | |
| Invite members | ✓ | ✓ | | |
| Remove members | ✓ | ✓ | | |
| Change member roles | ✓ | ✓ | | |
| View billing | ✓ | | | |
| Manage billing / subscription | ✓ | | | |
| Transfer ownership | ✓ | | | |
| Manage organisation settings | ✓ | ✓ | | |
| Delete organisation | ✓ | | | |

### `internal-tool`

| Permission | Admin | User |
|---|---|---|
| View main dashboard | ✓ | ✓ |
| View own records | ✓ | ✓ |
| Create records | ✓ | ✓ |
| Edit own records | ✓ | ✓ |
| Edit any record | ✓ | |
| Delete records | ✓ | |
| Manage users | ✓ | |
| View audit log | ✓ | |
| Manage system settings | ✓ | |

### `marketplace`

| Permission | Moderator | Seller | Buyer |
|---|---|---|---|
| Browse listings | ✓ | ✓ | ✓ |
| View listing detail | ✓ | ✓ | ✓ |
| Create listing | | ✓ | |
| Edit own listing | | ✓ | |
| Place order | | | ✓ |
| Cancel own order | | | ✓ |
| Fulfil order (own listings) | | ✓ | |
| Message buyer / seller (own transactions) | ✓ | ✓ | ✓ |
| Report a listing or user | ✓ | ✓ | ✓ |
| Resolve a report | ✓ | | |
| Suspend a listing | ✓ | | |
| Suspend a user | ✓ | | |
| Refund an order | ✓ | ~ | |

> Footnote on `~` (Seller — Refund): conditional — sellers can refund their own buyers; moderators can refund any. `design-roles-agent` will surface this for confirmation at DESIGN.

### `editorial`

| Permission | Editor | Author | Contributor | Reader |
|---|---|---|---|---|
| View published content | ✓ | ✓ | ✓ | ✓ |
| View drafts (own) | ✓ | ✓ | ✓ | |
| View drafts (any) | ✓ | | | |
| Create draft | ✓ | ✓ | ✓ | |
| Edit own draft | ✓ | ✓ | ✓ | |
| Edit any draft | ✓ | | | |
| Submit for review | ✓ | ✓ | ✓ | |
| Approve / publish | ✓ | | | |
| Unpublish | ✓ | | | |
| Delete content | ✓ | | | |
| Manage taxonomies / tags | ✓ | | | |
| Manage contributors | ✓ | | | |

### `custom`

No default matrix — `design-roles-agent` generates a starter grid populated only with "View main dashboard" for every role, then prompts the user to expand it. The free-text role list captured at INTAKE (`context.customRoles`) is the column header source.

---

## Forward Compatibility Notes

The matrix structure produced by `design-roles-agent` (rows = permission strings, columns = role names, cells = `granted | denied | conditional`) is the same shape that a future `/roles-update` slash command will edit. New permissions can be added to a template's default matrix here; existing projects keep their signed-off matrix unchanged.

When adding a new template:
1. Add a row to the Template Registry table above
2. Add a new section below with the default matrix
3. Update the `intake-agent` inference rules if the new template has detectable signal in `documentation/`
4. Update the `intake-agent` checklist question option list

---

## Out of Scope (Tracked Separately)

The roles template work intentionally does **not** cover:

- User management UI (list / invite / disable / reset)
- User provisioning model (self-signup / invite / SSO / manual)
- Role assignment flows
- SSO integration paths

The matrix structure here is forward-compatible with those features, but each is a separate workstream. See `generated-docs/intake-redesign-plan.md` § "Deferred (Separate Problem)" for context.
