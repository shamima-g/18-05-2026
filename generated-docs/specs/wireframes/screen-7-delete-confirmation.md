# Screen: Delete Confirmation Dialog

## Purpose
Two-step confirmation modal that appears when an Admin initiates task deletion — requires explicit "Confirm Delete" action before the task is removed; a Cancel action leaves the task and the data intact.

## Wireframe

### Triggered from Task List (row context)

```
+------------------------------------------------------------------+
|  (Task List — Admin view dimmed in background)                   |
|                                                                  |
|          +------------------------------------------+           |
|          |                                     [X]  |           |
|          |  Delete Task?                            |           |
|          |  ────────────────────────────────────    |           |
|          |                                          |           |
|          |  Are you sure you want to delete         |           |
|          |  "Build login page"?                     |           |
|          |                                          |           |
|          |  This action cannot be undone.           |           |
|          |                                          |           |
|          |  ────────────────────────────────────    |           |
|          |         [Cancel]    [Confirm Delete]     |           |
|          |                                          |           |
|          +------------------------------------------+           |
|                                                                  |
+------------------------------------------------------------------+
```

### Triggered from Task Detail (Admin view)

```
+------------------------------------------------------------------+
|  (Task Detail — Admin view dimmed in background)                 |
|                                                                  |
|          +------------------------------------------+           |
|          |                                     [X]  |           |
|          |  Delete Task?                            |           |
|          |  ────────────────────────────────────    |           |
|          |                                          |           |
|          |  Are you sure you want to delete         |           |
|          |  "Build login page"?                     |           |
|          |                                          |           |
|          |  This action cannot be undone.           |           |
|          |                                          |           |
|          |  ────────────────────────────────────    |           |
|          |         [Cancel]    [Confirm Delete]     |           |
|          |                                          |           |
|          +------------------------------------------+           |
|                                                                  |
+------------------------------------------------------------------+
```

### Loading / Processing State (after Confirm Delete clicked)

```
|          |         [Cancel]    [Deleting...]        |           |
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| Modal overlay | Dialog / modal | Sits above the triggering screen; background dimmed |
| Close [X] button | Icon button | Dismisses dialog; same outcome as Cancel |
| Dialog title | H2 | "Delete Task?" |
| Task name reference | Body text | Displays the task's title in quotes so Admin can confirm the correct task |
| Warning text | Body text | "This action cannot be undone." |
| Cancel button | Ghost button | Closes dialog; task is NOT deleted (R13) |
| Confirm Delete button | Danger / destructive button | Removes the task from the mock store and closes the dialog (R11, R12) |
| Loading state | Button text change | "Confirm Delete" → "Deleting..." while async mock operation runs |

## User Actions

- **Click "Confirm Delete":** Task is deleted from the mock store; dialog closes; user is returned to the Task List (R12).
- **Click "Cancel" or [X]:** Dialog closes; task is not deleted; user remains on the current screen (R13).
- **Press Escape:** Standard keyboard dismiss — same outcome as Cancel (NFR1).

## Navigation

- **From:** Task List — Admin view (Screen 2) via Delete icon on a row, OR Task Detail — Admin view (Screen 4) via "Delete Task" button.
- **To (on confirm):** Task List — Admin view (Screen 2) — task removed from list (R12).
- **To (on cancel/close):** Returns to the screen that triggered the dialog (Task List or Task Detail), unchanged.

## Role Notes

- This dialog is only reachable by Admin users (BR3, BR6).
- The two-step confirmation pattern is a hard requirement (BR6) — single-click deletion is explicitly prohibited.
