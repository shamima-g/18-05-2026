# Screen: Task List (Admin View)

## Purpose
Displays all tasks in the system regardless of assignee; provides the Create Task entry point and per-row delete action for Admin users.

## Wireframe

### Desktop / Tablet (≥ 768 px)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: A.Smith v]          |
+------------------------------------------------------------------+
|                                                                  |
|  All Tasks                           [+ Create Task]            |
|  ──────────────────────────────────────────────────────────      |
|                                                                  |
|  +----+------------------+------------+-----------+----------+--+
|  | #  | Title            | Assignee   | Due Date  | Status   |  |
|  +----+------------------+------------+-----------+----------+--+
|  | 1  | Build login page | J. Doe     | 2026-05-20| pending  |[x]|
|  +----+------------------+------------+-----------+----------+--+
|  | 2  | Write tests      | A. Smith   | 2026-05-22| complete |[x]|
|  +----+------------------+------------+-----------+----------+--+
|  | 3  | Deploy to staging| M. Chen    | 2026-05-25| pending  |[x]|
|  +----+------------------+------------+-----------+----------+--+
|                                                                  |
|  (each row is clickable → Task Detail)                           |
|                                                                  |
+------------------------------------------------------------------+
```

### Mobile (< 768 px) — Stacked Cards

```
+----------------------------------+
|  TaskFlow    [Avatar: A.Smith v] |
+----------------------------------+
|                                  |
|  All Tasks      [+ Create Task]  |
|  ──────────────────────────────  |
|                                  |
|  +------------------------------+|
|  | Build login page             ||
|  | Assignee: J. Doe             ||
|  | Due: 2026-05-20  [pending]   ||
|  |                       [Delete]|
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  | Write tests                  ||
|  | Assignee: A. Smith           ||
|  | Due: 2026-05-22  [complete]  ||
|  |                       [Delete]|
|  +------------------------------+|
|                                  |
+----------------------------------+
```

### Empty State

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: A.Smith v]          |
+------------------------------------------------------------------+
|                                                                  |
|  All Tasks                           [+ Create Task]            |
|  ──────────────────────────────────────────────────────────      |
|                                                                  |
|        (illustration placeholder)                               |
|                                                                  |
|              No tasks yet.                                       |
|         Create your first task to get started.                  |
|                                                                  |
|               [+ Create Task]                                   |
|                                                                  |
+------------------------------------------------------------------+
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| App header | Navigation bar | Logo, nav links, user avatar/dropdown |
| User avatar / dropdown | Button + menu | Shows current user name; dropdown contains Sign Out and Profile links |
| "All Tasks" heading | H1 | Page title |
| Create Task button | Primary button | Opens Create Task modal (Screen 6) |
| Task table | Data table | Columns: #, Title, Assignee, Due Date, Status, Actions |
| Table row | Clickable row | Entire row navigates to Task Detail (Screen 4 — Admin view) |
| Delete icon / button | Danger icon button | Per-row; triggers Delete Confirmation Dialog (Screen 7) |
| Status badge | Badge / pill | Renders "pending" or "complete" with distinct colours |
| Empty state | Illustration + text | Shown when task list is empty (R5) |
| Mobile card | Card component | Replaces table rows on viewports < 768 px |

## User Actions

- **Click row (table) or card body:** Navigate to Task Detail — Admin view (Screen 4).
- **Click "+ Create Task":** Open Create Task modal (Screen 6).
- **Click Delete [x] on a row:** Open Delete Confirmation Dialog (Screen 7) with the task context.
- **Click user avatar dropdown → "Profile":** Open Account / Profile modal (Screen 8).
- **Click user avatar dropdown → "Sign Out":** End session, redirect to Login.

## Navigation

- **From:** Login screen on successful auth (R2); back from Task Detail after delete/cancel.
- **To:** Task Detail — Admin (Screen 4) via row click; Create Task modal (Screen 6) via button; Delete Confirmation (Screen 7) via delete icon.

## Role Notes

- Admin sees ALL tasks (R3). The "Assignee" column is always visible for Admin.
- The "+ Create Task" button and Delete icons are only rendered for Admin (BR1, BR3).
