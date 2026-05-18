# Screen: Task Detail (Member View)

## Purpose
Read-only task detail for Member users — shows all task fields but permits only the "Mark Complete" action (when the task is still pending) and enforces a 403 / redirect for tasks not assigned to the current Member.

## Wireframe

### Default State (pending task, assigned to current Member)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to My Tasks]                                            |
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
|  |  J. Doe (you)                                              |  |
|  |                                                            |  |
|  |  Due Date                                                  |  |
|  |  2026-05-20                                                |  |
|  |  (no edit affordance)                                      |  |
|  |                                                            |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  [Mark Complete]                                           |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Completed State (task already marked complete)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to My Tasks]                                            |
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
|  |  J. Doe (you)                                              |  |
|  |                                                            |  |
|  |  Due Date                                                  |  |
|  |  2026-05-20                                                |  |
|  |                                                            |  |
|  |  ──────────────────────────────────────────────────────   |  |
|  |                                                            |  |
|  |  [Mark Complete — disabled / greyed out]                   |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 403 / Unauthorised State (task belongs to a different Member)

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
+------------------------------------------------------------------+
|                                                                  |
|  [← Back to My Tasks]                                            |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  Access Denied                                             |  |
|  |                                                            |  |
|  |  You do not have permission to view this task.             |  |
|  |                                                            |  |
|  |  [← Return to My Tasks]                                    |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| Back link | Link / breadcrumb | Returns to Task List — Member view |
| Task title | H1 | Read-only display |
| Status badge | Badge / pill | "pending" or "complete" |
| Description | Static text | Full description (may be empty) |
| Assigned to | Static text | Shows "(you)" annotation to confirm assignment |
| Due Date | Static text | Read-only; no edit affordance (BR2) |
| Mark Complete | Primary button | Sets `task.status = "complete"` (R14); disabled when already complete |
| 403 error card | Error state block | Shown when `task.assignedUserId !== currentUser.id`; includes return link (R17) |

## User Actions

- **Click "Mark Complete" (pending state):** Updates task status to "complete"; button becomes disabled.
- **Click "← Back to My Tasks" / "← Return to My Tasks":** Returns to Task List — Member view.

## Navigation

- **From:** Task List — Member view (Screen 3) via row click. Also reachable by direct URL — guarded by role check.
- **To:** Task List — Member view (Screen 3) via back link or after 403 redirect.

## Role Notes

- No "Edit Due Date" affordance — BR2 prohibits this for Members.
- No "Delete Task" affordance — BR3 prohibits this for Members.
- Direct URL access to a task not assigned to this Member returns a 403 state or immediate redirect (R17, BR5).
- Member can only mark tasks complete when the task is in "pending" status (R14).
