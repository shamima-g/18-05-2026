# Wireframes: Task Management Tool for Small Teams

## Summary

A role-gated task management UI with two roles (Admin and Member). Admin users can create, view all, edit, and delete tasks. Member users see only their own assigned tasks and can mark them complete. All routes are authentication-gated. Two POPIA compliance touchpoints are wired in: a purpose statement on the Login screen and a data-erasure mechanism in the Account modal.

## Screens

| # | Screen | Description | File |
|---|--------|-------------|------|
| 1 | Login | Auth gate with email/password form, POPIA purpose statement, and privacy policy link | `screen-1-login.md` |
| 2 | Task List (Admin) | All tasks in a sortable table (desktop) or stacked cards (mobile); Create Task button and per-row Delete | `screen-2-task-list-admin.md` |
| 3 | Task List (Member) | Same route as screen 2, role-conditional render; only own tasks; no create/delete affordances | `screen-3-task-list-member.md` |
| 4 | Task Detail (Admin) | Full task info with inline due-date picker, Mark Complete, and Delete button | `screen-4-task-detail-admin.md` |
| 5 | Task Detail (Member) | Read-only task info; Mark Complete only when pending; 403 error state for unassigned tasks | `screen-5-task-detail-member.md` |
| 6 | Create Task Modal | Admin-only modal overlay with title/description/due date/assignee fields and inline validation | `screen-6-create-task-modal.md` |
| 7 | Delete Confirmation Dialog | Two-step confirmation modal over List or Detail; Confirm Delete / Cancel | `screen-7-delete-confirmation.md` |
| 8 | Account / Profile Modal | Minimal header modal showing read-only user info; POPIA data-erasure request mechanism | `screen-8-account-profile-modal.md` |

## Screen Flow

```
[Login]
   |
   +--(admin)--> [Task List — Admin]
   |                  |            \
   |          [row click]    [+ Create Task]
   |                  |                 \
   |       [Task Detail — Admin]    [Create Task Modal]
   |           /          \                  |
   |  [Edit Due Date]  [Delete Task]    (success → back to Task List)
   |  (inline picker)       |
   |                [Delete Confirmation]
   |                  /           \
   |           (confirm)       (cancel)
   |          [Task List]    [previous screen]
   |
   +--(member)--> [Task List — Member]
                       |
                  [row click]
                       |
               [Task Detail — Member]
                  (mark complete / read-only)
                       |
                  [← back to My Tasks]

   Header (all authenticated screens):
     [Avatar dropdown] → [Account / Profile Modal]
                               |
                       [Request Data Erasure]
                               |
                       [Erasure Sub-dialog]
                        /            \
                (confirm)          (cancel)
               [Login]        [Account Modal]
```

## Design Notes

- **Responsive breakpoints:** Table layout at ≥ 768 px; stacked card layout on mobile (< 768 px). Matches NFR3 (360 px / 768 px / 1280 px).
- **Role-conditional rendering:** Screens 2 and 3 share the same route; the Admin/Member distinction is applied by reading the session role. Same pattern for Task Detail (screens 4 and 5).
- **Modal pattern consistency:** Create Task (screen 6), Delete Confirmation (screen 7), and Account / Profile (screen 8) all follow the same dimmed-background overlay approach, keeping the navigation stack shallow.
- **Status badges:** "pending" and "complete" are the only valid status values (BR7); badge colours should be chosen to meet WCAG 2.1 AA contrast (NFR1).
- **Empty states:** Both Task List variants include a distinct empty-state illustration/message (R5).
- **POPIA compliance:** Purpose statement + privacy policy link on Login (CR1, CR4); privacy policy link also on Create Task modal (CR4); data-erasure mechanism in Account modal (CR2).
- **Keyboard accessibility:** All modals must trap focus while open and return focus to the trigger element on close (NFR1).
