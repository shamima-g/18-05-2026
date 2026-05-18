# Permissions Matrix

**Selected template:** internal-tool (Internal Tool)
**Roles (most → least privileged):** Admin, Member

---

## Matrix

| Permission | Admin | Member |
|---|---|---|
| Sign in (authenticate) | ✓ | ✓ |
| View task list (own tasks) | ✓ | ✓ |
| View all tasks (any assignee) | ✓ | |
| View task detail (own task) | ✓ | ✓ |
| View task detail (any task) | ✓ | |
| Create task | ✓ | |
| Assign task to a member | ✓ | |
| Edit task due date | ✓ | |
| Mark own task complete | ✓ | ✓ |
| Mark any task complete | ✓ | |
| Delete task | ✓ | |
| Manage users (view user list for assignment) | ✓ | |
| View consent / purpose statement (Login screen) | ✓ | ✓ |
| Access privacy policy link | ✓ | ✓ |
| Submit personal data erasure request | ✓ | ✓ |

---

## Footnotes

1. **View task list (own tasks) — Member:** A Member's task list is filtered by `task.assignedUserId === currentUser.id`. Tasks assigned to other users are not returned or displayed (R4, BR5).

2. **View task detail (any task) — Admin only:** An Admin may navigate to the Task Detail screen for any task regardless of assignee (R3, R6). A Member who navigates directly to a task detail route for a task not assigned to them receives a 403 response or is redirected to the Task List (R17, BR5).

3. **Mark own task complete — both roles:** Both Admin and Member can mark a task complete, but Member may only do so for tasks assigned to themselves. Admin may mark any task complete (R14, R15). The `assumptions.md` §3 note ("Confirm at DESIGN whether Admin should be blocked") is resolved here in favour of allowing Admin to mark any task complete, consistent with R15 which explicitly states "An Admin user can mark any task as complete."

4. **Manage users — Admin only:** This permission covers the ability to view the user list when populating the "assigned person" dropdown on the Create Task form (R7, BR4). Full user management UI (invite, disable, reset) is out of scope per FRS §10.

5. **View consent / purpose statement and privacy policy link — all authenticated users:** These are POPIA compliance obligations applicable to any user who can reach a data-collection screen. The login screen and Create Task form must show the privacy policy link (CR1, CR4). All authenticated users can submit a data erasure request (CR2).

6. **Delete task — Admin only, two-step:** Task deletion requires the Delete Confirmation dialog and explicit user confirmation before removal (BR6, R11, R12, R13). The delete affordance is not rendered for Member users (BR3).

---

## FRS Cross-Reference

| FRS ID | Permission row | Notes |
|---|---|---|
| R1 | Sign in (authenticate) | All users must authenticate; no public access |
| R2 | Sign in (authenticate) | Successful auth redirects to task list |
| R3 | View all tasks (any assignee) | Admin task list shows all tasks in the system |
| R4 | View task list (own tasks) | Member task list filtered to own assigned tasks |
| R5 | View task list (own tasks) | Empty state rendered when no tasks visible to current user |
| R6 | View task detail (own task) / View task detail (any task) | Task Detail screen accessible per role scope |
| R7 | Create task / Assign task to a member | Admin opens Create Task form; title and assigned person required |
| R8 | Create task | Form blocks submission when title is empty |
| R9 | Create task / Assign task to a member | Form blocks submission when no assigned person selected |
| R10 | Edit task due date | Admin edits due date from Task Detail screen |
| R11 | Delete task | Admin initiates deletion; confirmation dialog required |
| R12 | Delete task | On confirm: task removed, user returned to task list |
| R13 | Delete task | On cancel: task not removed, dialog closes |
| R14 | Mark own task complete | Member marks own assigned task as complete |
| R15 | Mark any task complete | Admin marks any task as complete |
| R16 | Sign in (authenticate) | Auth guard: all routes except login redirect unauthenticated users |
| R17 | View task detail (any task) | Member accessing another user's task detail → 403 or redirect |
| R18 | (all rows) | All permission actions are executed against the mock data layer; no external API |
| R19 | (all rows) | Seed data pre-populates tasks and users to support all permission paths |
| BR1 | Create task | Admin-only; no access for Member role |
| BR2 | Edit task due date | Admin-only; edit affordance not rendered for Member |
| BR3 | Delete task | Admin-only; delete affordance not rendered for Member |
| BR4 | Assign task to a member | Admin-only; assigned-person field not editable by Member |
| BR5 | View task list (own tasks) / View task detail (own task) | Member scoped to tasks where assignedUserId === currentUser.id |
| BR6 | Delete task | Two-step deletion via Delete Confirmation dialog; single-click deletion prohibited |
| BR7 | Mark own task complete / Mark any task complete | Status field accepts only `pending` or `complete` |
| BR8 | Create task | Title required; cannot save without non-empty title |
| BR9 | Create task / Assign task to a member | assignedUserId required; cannot create without assigned person |
| BR10 | Sign in (authenticate) | Session managed client-side via NextAuth JWT; no BFF |
| BR11 | Sign in (authenticate) | All routes authentication-gated; no public pages |
| CR1 | View consent / purpose statement (Login screen) | Purpose statement and consent mechanism on Login screen |
| CR2 | Submit personal data erasure request | Both roles can submit a data erasure request |
| CR3 | Sign in (authenticate) | HTTPS enforced for all data transmission; credentials protected |
| CR4 | Access privacy policy link | Privacy policy link visible on Login screen and Create Task form |

---

## Source

- Template registry: [`.claude/shared/roles-templates.md`](../../.claude/shared/roles-templates.md)
- Selected at: `intake-manifest.json` `context.rolesTemplate` = `internal-tool`
- Custom role rename: `context.customRoles` = `["Admin", "Member"]` (User → Member)
- Seed reviewed at: Gate 1 (`assumptions.md` §3, Permissions Matrix seed)
- Signed off at: DESIGN phase via `design-roles-agent`
