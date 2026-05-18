# Screen: Task List (Member View)

## Purpose
Same route as the Admin Task List but role-conditionally rendered — shows only tasks assigned to the currently logged-in Member, with no Create or Delete affordances.

## Wireframe

### Desktop / Tablet (≥ 768 px)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
+------------------------------------------------------------------+
|                                                                  |
|  My Tasks                                                        |
|  ──────────────────────────────────────────────────────────      |
|                                                                  |
|  +----+------------------+-----------+----------+               |
|  | #  | Title            | Due Date  | Status   |               |
|  +----+------------------+-----------+----------+               |
|  | 1  | Build login page | 2026-05-20| pending  |               |
|  +----+------------------+-----------+----------+               |
|  | 2  | Write tests      | 2026-05-22| complete |               |
|  +----+------------------+-----------+----------+               |
|                                                                  |
|  (each row is clickable → Task Detail)                           |
|                                                                  |
+------------------------------------------------------------------+
```

### Mobile (< 768 px) — Stacked Cards

```
+----------------------------------+
|  TaskFlow    [Avatar: J.Doe v]   |
+----------------------------------+
|                                  |
|  My Tasks                        |
|  ──────────────────────────────  |
|                                  |
|  +------------------------------+|
|  | Build login page             ||
|  | Due: 2026-05-20  [pending]   ||
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  | Write tests                  ||
|  | Due: 2026-05-22  [complete]  ||
|  +------------------------------+|
|                                  |
+----------------------------------+
```

### Empty State

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
+------------------------------------------------------------------+
|                                                                  |
|  My Tasks                                                        |
|  ──────────────────────────────────────────────────────────      |
|                                                                  |
|        (illustration placeholder)                               |
|                                                                  |
|           You have no tasks assigned yet.                        |
|         Check back later or contact your admin.                 |
|                                                                  |
+------------------------------------------------------------------+
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| App header | Navigation bar | Logo, nav links, user avatar/dropdown |
| User avatar / dropdown | Button + menu | Shows current user name; dropdown contains Sign Out and Profile links |
| "My Tasks" heading | H1 | Page title (Member sees "My Tasks", not "All Tasks") |
| Task table | Data table | Columns: #, Title, Due Date, Status (NO Assignee column, no Actions column) |
| Table row | Clickable row | Navigates to Task Detail — Member view (Screen 5) |
| Status badge | Badge / pill | Renders "pending" or "complete" with distinct colours |
| Empty state | Illustration + text | Shown when no tasks are assigned to this Member (R5) |
| Mobile card | Card component | Replaces table rows on viewports < 768 px |

## User Actions

- **Click row (table) or card body:** Navigate to Task Detail — Member view (Screen 5).
- **Click user avatar dropdown → "Profile":** Open Account / Profile modal (Screen 8).
- **Click user avatar dropdown → "Sign Out":** End session, redirect to Login.

## Navigation

- **From:** Login screen on successful auth as a Member (R2); back from Task Detail.
- **To:** Task Detail — Member (Screen 5) via row click.

## Role Notes

- Member sees ONLY tasks where `task.assignedUserId === currentUser.id` (R4, BR5).
- No "Create Task" button — BR1 prohibits rendering this for Members.
- No Delete affordance — BR3 prohibits rendering this for Members.
- No "Assignee" column — all visible tasks belong to the current user; the column adds no information.
- The table is identical in structure to the Admin view but narrower (fewer columns) so the same responsive breakpoints apply.
