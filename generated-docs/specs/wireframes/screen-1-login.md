# Screen: Login

## Purpose
Authentication gate — accepts email and password, displays POPIA purpose statement and privacy policy link; unauthenticated users cannot reach any other route.

## Wireframe

```
+----------------------------------------------------------+
|                                                          |
|                   TaskFlow                               |
|                (app logo / name)                         |
|                                                          |
|  +----------------------------------------------------+  |
|  |                                                    |  |
|  |              Sign in to your account               |  |
|  |                                                    |  |
|  |  Email address                                     |  |
|  |  [email@example.com                           ]    |  |
|  |                                                    |  |
|  |  Password                                          |  |
|  |  [••••••••••••••••                             ]   |  |
|  |                                                    |  |
|  |  [           Sign In                          ]    |  |
|  |                                                    |  |
|  |  !! Incorrect email or password. (error state)     |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | POPIA notice: We collect your name and email       |  |
|  | address to authenticate you and assign tasks       |  |
|  | within this tool. Your data is not shared with     |  |
|  | third parties.  [Read our Privacy Policy]          |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

## Elements

| Element | Type | Description |
|---------|------|-------------|
| App name / logo | Heading | Branding mark at top |
| Email address | Text input (type="email") | Required; validated as email format |
| Password | Text input (type="password") | Required; masked |
| Sign In | Primary button | Submits credentials to NextAuth credentials provider |
| Inline error message | Error text | Shown below the button on failed authentication ("Incorrect email or password.") |
| POPIA purpose statement | Static text block | Explains why name and email are collected (CR1) |
| Privacy Policy link | Anchor / link | Opens privacy policy in new tab (CR4) |

## User Actions

- **Enter email and password, click Sign In:** If credentials are valid — redirected to Task List. If invalid — inline error displayed, form remains.
- **Click Privacy Policy link:** Opens privacy policy document in a new tab.
- **Submit empty form:** Browser/JS validation fires; required field error shown before network call.

## Navigation

- **From:** Direct URL `/login`, or redirect from any auth-gated route when session is absent (R16).
- **To:** Task List (Admin view or Member view depending on authenticated role) on successful sign-in (R2).

## Compliance Notes

- CR1: POPIA purpose statement is mandatory on this screen.
- CR4: Privacy policy link must be visible on this data-collection screen.
- HTTPS is enforced at the infrastructure level (CR3); no UI affordance needed.
