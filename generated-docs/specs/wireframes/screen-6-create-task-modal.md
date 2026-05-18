# Screen: Create Task (Modal Overlay)

## Purpose
Admin-only modal overlay for creating a new task — collects title (required), description (optional), due date, and assignee (required) with inline validation before submission.

## Wireframe

### Default / Empty State

```
+------------------------------------------------------------------+
|  (Task List — Admin view dimmed in background)                   |
|                                                                  |
|        +----------------------------------------------+         |
|        |                                         [X]  |         |
|        |  Create New Task                             |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  Title *                                     |         |
|        |  [                                      ]    |         |
|        |                                              |         |
|        |  Description                                 |         |
|        |  [                                      ]    |         |
|        |  [                   (textarea)         ]    |         |
|        |                                              |         |
|        |  Due Date                                    |         |
|        |  [2026-05-20 (date input)             ]      |         |
|        |                                              |         |
|        |  Assigned to *                               |         |
|        |  [Select a team member              v ]      |         |
|        |                                              |         |
|        |  Privacy Policy: task assignment data is     |         |
|        |  processed under our [Privacy Policy].       |         |
|        |                                              |         |
|        |  ──────────────────────────────────────────  |         |
|        |              [Cancel]  [Create Task]         |         |
|        |                                              |         |
|        +----------------------------------------------+         |
|                                                                  |
+------------------------------------------------------------------+
```

### Validation Error State (Submit clicked with missing required fields)

```
+------------------------------------------------------------------+
|  (Task List — Admin view dimmed in background)                   |
|                                                                  |
|        +----------------------------------------------+         |
|        |                                         [X]  |         |
|        |  Create New Task                             |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  Title *                                     |         |
|        |  [                                      ]    |         |
|        |  !! Title is required.                       |         |
|        |                                              |         |
|        |  Description                                 |         |
|        |  [                                      ]    |         |
|        |  [                   (textarea)         ]    |         |
|        |                                              |         |
|        |  Due Date                                    |         |
|        |  [2026-05-20 (date input)             ]      |         |
|        |                                              |         |
|        |  Assigned to *                               |         |
|        |  [Select a team member              v ]      |         |
|        |  !! Please select an assigned person.        |         |
|        |                                              |         |
|        |  Privacy Policy: task assignment data is     |         |
|        |  processed under our [Privacy Policy].       |         |
|        |                                              |         |
|        |  ──────────────────────────────────────────  |         |
|        |              [Cancel]  [Create Task]         |         |
|        |                                              |         |
|        +----------------------------------------------+         |
|                                                                  |
+------------------------------------------------------------------+
```

### Assignee Dropdown Open

```
|        |  Assigned to *                               |         |
|        |  [Select a team member              v ]      |         |
|        |  +--------------------------------------+    |         |
|        |  | J. Doe                               |    |         |
|        |  | A. Smith                             |    |         |
|        |  | M. Chen                              |    |         |
|        |  +--------------------------------------+    |         |
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| Modal overlay | Dialog / modal | Sits above the Task List; background dimmed |
| Close [X] button | Icon button | Dismisses modal without saving (same as Cancel) |
| Modal title | H2 | "Create New Task" |
| Title field | Text input (required) | Task title; marked with asterisk; validated on submit (R8, BR8) |
| Title error | Inline error text | "Title is required." — appears below the field on validation failure |
| Description field | Textarea (optional) | Multi-line; no character limit shown in this phase |
| Due Date field | Date input | Optional; defaults to today or blank |
| Assigned to dropdown | Select (required) | Lists all team members from mock store; marked with asterisk; validated on submit (R9, BR9) |
| Assignee error | Inline error text | "Please select an assigned person." — appears below the dropdown on validation failure |
| Privacy Policy notice | Static text + link | "task assignment data is processed under our Privacy Policy" (CR4) |
| Cancel button | Ghost button | Closes modal; no task created |
| Create Task button | Primary button | Validates and submits; blocked if required fields are empty |

## User Actions

- **Fill Title, Description, Due Date, select Assignee, click "Create Task":** If valid — task created in mock store, modal closes, new task appears in the list (R7). If invalid — inline errors displayed, submission blocked (R8, R9).
- **Click Cancel or [X]:** Modal closes; no task created.
- **Tab / keyboard navigation:** All form fields and buttons are keyboard accessible (NFR1).
- **Click Privacy Policy link:** Opens privacy policy in a new tab (CR4).

## Navigation

- **From:** Task List — Admin view (Screen 2) via "+ Create Task" button.
- **To (on success):** Returns to Task List — Admin view with new task visible.
- **To (on cancel/close):** Returns to Task List — Admin view unchanged.

## Role Notes

- This modal is only accessible to Admin users (BR1).
- Assignee dropdown is populated from the mock user store and only includes users with `role === "member"` (or all users depending on implementation choice — to be confirmed at BUILD).
