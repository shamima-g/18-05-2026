# Screen: Task Detail (Admin View)

## Purpose
Displays full task information for Admin users; provides inline due-date editing, Mark Complete, and Delete actions.

## Wireframe

### Default State (pending task)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: A.Smith v]          |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to All Tasks]                                           |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  Build login page                      [pending]          |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  Description                                               |  |
|  |  Implement the NextAuth login screen with email and        |  |
|  |  password fields.                                          |  |
|  |                                                            |  |
|  |  Assigned to                                               |  |
|  |  J. Doe                                                    |  |
|  |                                                            |  |
|  |  Due Date                                                  |  |
|  |  2026-05-20          [Edit Due Date]                       |  |
|  |                                                            |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  [Mark Complete]      [Delete Task]                        |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Due Date Edit State (inline date picker open)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: A.Smith v]          |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to All Tasks]                                           |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  Build login page                      [pending]          |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  Description                                               |  |
|  |  Implement the NextAuth login screen with email and        |  |
|  |  password fields.                                          |  |
|  |                                                            |  |
|  |  Assigned to                                               |  |
|  |  J. Doe                                                    |  |
|  |                                                            |  |
|  |  Due Date                                                  |  |
|  |  +-----------------------------------+                     |  |
|  |  | [2026-05-20 (date input)     ]    |  [Save]  [Cancel]  |  |
|  |  +-----------------------------------+                     |  |
|  |    (native/custom date picker popup)                       |  |
|  |                                                            |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  [Mark Complete]      [Delete Task]                        |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Completed State

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: A.Smith v]          |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to All Tasks]                                           |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  Build login page                     [complete]          |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  Description                                               |  |
|  |  Implement the NextAuth login screen with email and        |  |
|  |  password fields.                                          |  |
|  |                                                            |  |
|  |  Assigned to                                               |  |
|  |  J. Doe                                                    |  |
|  |                                                            |  |
|  |  Due Date                                                  |  |
|  |  2026-05-20          [Edit Due Date]                       |  |
|  |                                                            |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  [Mark Complete — disabled / greyed out]   [Delete Task]  |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| Back link | Link / breadcrumb | Returns to Task List — Admin view |
| Task title | H1 | Non-editable display of the task title |
| Status badge | Badge / pill | "pending" or "complete" with colour coding |
| Description | Static text | Full task description (may be empty) |
| Assigned to | Static text | Name of the assigned team member |
| Due Date | Static text + Edit trigger | Displays formatted date; "Edit Due Date" button toggles edit mode |
| Inline date picker | Date input (edit mode only) | Shown when Admin clicks "Edit Due Date"; includes Save and Cancel buttons |
| Save button | Primary button (edit mode) | Persists the updated due date to the mock store (R10) |
| Cancel button | Ghost button (edit mode) | Reverts to read-only due date display without saving |
| Mark Complete | Primary button | Sets `task.status = "complete"` (R15); disabled when already complete |
| Delete Task | Danger button | Opens Delete Confirmation Dialog (Screen 7) with this task's context (R11) |

## User Actions

- **Click "Edit Due Date":** Replaces the due date text with an inline date input + Save/Cancel.
- **Edit date, click Save:** Persists new date; returns to read-only display.
- **Click Cancel (in edit mode):** Discards change; returns to read-only display.
- **Click "Mark Complete":** Updates task status to "complete"; button becomes disabled.
- **Click "Delete Task":** Opens Delete Confirmation Dialog (Screen 7).
- **Click "← Back to All Tasks":** Returns to Task List — Admin view.

## Navigation

- **From:** Task List — Admin view (Screen 2) via row click.
- **To:** Task List — Admin view (Screen 2) via back link or after delete confirmation; Delete Confirmation Dialog (Screen 7) via delete button.

## Role Notes

- All edit and delete affordances are visible only for Admin (BR2, BR3).
- Admin can mark any task complete regardless of assignee (R15).
