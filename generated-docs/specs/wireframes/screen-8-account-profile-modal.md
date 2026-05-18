# Screen: Account / Profile (Modal)

## Purpose
Minimal profile modal accessible from the header for all authenticated users — its sole functional purpose is to provide the POPIA data-erasure mechanism (CR2). Not a full settings page.

## Wireframe

### Default State

```
+------------------------------------------------------------------+
|  TaskFlow          [Tasks]          [Avatar: J.Doe v]            |
|                             (background dimmed)                  |
|                                                                  |
|        +----------------------------------------------+         |
|        |                                         [X]  |         |
|        |  Your Account                                |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  Name                                        |         |
|        |  J. Doe                                      |         |
|        |                                              |         |
|        |  Email                                       |         |
|        |  j.doe@example.com                           |         |
|        |                                              |         |
|        |  Role                                        |         |
|        |  Member                                      |         |
|        |                                              |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  Data & Privacy                              |         |
|        |                                              |         |
|        |  You have the right to request erasure of   |         |
|        |  your personal data under POPIA. This will  |         |
|        |  remove your name and email from the system. |         |
|        |                                              |         |
|        |  [Request Data Erasure]                      |         |
|        |                                              |         |
|        |  ──────────────────────────────────────────  |         |
|        |                              [Close]         |         |
|        |                                              |         |
|        +----------------------------------------------+         |
|                                                                  |
+------------------------------------------------------------------+
```

### Data Erasure Confirmation Sub-dialog (after clicking Request Data Erasure)

```
|        +----------------------------------------------+         |
|        |                                         [X]  |         |
|        |  Request Data Erasure?                       |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  This will permanently remove your personal  |         |
|        |  data (name and email) from this system.     |         |
|        |  You will be signed out immediately.         |         |
|        |                                              |         |
|        |  ──────────────────────────────────────────  |         |
|        |        [Cancel]   [Confirm Erasure]          |         |
|        |                                              |         |
|        +----------------------------------------------+         |
```

### Post-Erasure State (confirmation sent)

```
|        +----------------------------------------------+         |
|        |                                              |         |
|        |  Data Erasure Requested                      |         |
|        |  ──────────────────────────────────────────  |         |
|        |                                              |         |
|        |  Your request has been submitted. You will   |         |
|        |  be signed out now.                          |         |
|        |                                              |         |
|        |  (auto-redirect to Login after 3 seconds)    |         |
|        |                                              |         |
|        +----------------------------------------------+         |
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| Modal overlay | Dialog / modal | Sits above the current page; background dimmed |
| Close [X] button | Icon button | Dismisses modal; returns to current page |
| Modal title | H2 | "Your Account" |
| Name | Static text | Read-only display of the current user's name |
| Email | Static text | Read-only display of the current user's email |
| Role | Static text | Read-only display of "Admin" or "Member" |
| Data & Privacy section heading | H3 | Section divider |
| POPIA erasure notice | Body text | Explains the right to erasure under POPIA (CR2) |
| Request Data Erasure | Danger / outlined button | Opens the erasure confirmation sub-dialog |
| Erasure sub-dialog | Nested dialog | Two-step confirmation before initiating erasure |
| Cancel (sub-dialog) | Ghost button | Closes sub-dialog; no action taken |
| Confirm Erasure (sub-dialog) | Danger button | Triggers erasure in mock store; signs user out; redirects to Login |
| Close button (main modal footer) | Ghost button | Closes modal; returns to current page |

## User Actions

- **Open from header:** Click on the user avatar/name dropdown → "Profile".
- **Click Close or [X]:** Modal closes; user remains on the current page.
- **Click "Request Data Erasure":** Opens the erasure confirmation sub-dialog.
- **In sub-dialog, click Cancel:** Sub-dialog closes; back to the main account modal.
- **In sub-dialog, click Confirm Erasure:** Erasure recorded in mock store; session ended; redirect to Login screen.

## Navigation

- **From:** Header avatar/name dropdown on any authenticated page.
- **To (on close):** Returns to whichever page the modal was opened from.
- **To (on confirm erasure):** Login screen (after sign-out).

## Compliance Notes

- CR2: This modal is the application's sole POPIA data-erasure mechanism.
- The erasure flow uses a two-step confirmation to prevent accidental data deletion (mirrors the Delete Task pattern).
- Profile fields (Name, Email, Role) are read-only in this phase — this is not a profile editing screen.
