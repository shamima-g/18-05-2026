# Styling Centralisation Policy

## Core Principle

All styling lives in a single set of centralised design tokens. Components reference tokens by name — never by hex literal, never by inline rgba(), never by hard-coded Tailwind colour utilities. The reason: when the user revisits styling later (a `/style-update` slash command is planned), token-level edits propagate across the entire app. Scattered styling means every "let me tweak the brand colour" turns into a multi-file refactor.

This policy is **enforced at DESIGN** by `design-style-agent` and **monitored at IMPLEMENT and QA** by the developer and code-reviewer agents.

---

## What "Centralised" Means

The single source of truth for styling in this template is **`web/src/app/globals.css`** — specifically the `:root` and `.dark` blocks (Shadcn token names in `oklch()` colour space). The DESIGN phase produces overrides at `generated-docs/specs/design-tokens.css`; the design-style-agent integrates those overrides into `globals.css`.

Tokens cover:

- **Colours** — `--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, etc. (Shadcn convention)
- **Typography** — `--font-sans`, `--font-mono` (Tailwind `@theme`)
- **Spacing** — `--spacing-*` if customised; otherwise the Tailwind default scale
- **Radii** — `--radius`
- **Shadows** — `--shadow-*` if customised
- **Z-index** — `--z-*` if customised

If a component needs a value not represented by an existing token, the correct action is to **add a token**, not hard-code the value.

---

## Mandatory Rules

1. **Components reference tokens by name.** Use `var(--primary)`, `bg-primary`, `text-foreground`, etc. — the Shadcn/Tailwind helpers map to the underlying tokens.

2. **No hex literals in component code.** Anything matching `#[0-9a-fA-F]{3,8}\b` outside `globals.css` is a violation. Exceptions: SVG path attributes inside imported icons, and explicit comments documenting reference values.

3. **No inline `rgb()` / `rgba()` / `hsl()` / `oklch()` in component code.** Same reasoning — colour values belong in tokens.

4. **No Tailwind palette utilities for brand colours.** `bg-blue-600`, `text-red-500`, etc. are acceptable for transient design (e.g., a placeholder screen) but must be replaced before story commit. The brand palette goes in tokens; components use semantic helpers (`bg-primary`, `text-destructive`).

5. **Dark mode must work end-to-end.** Every colour token has a `:root` value AND a `.dark` value. Components must NOT hard-code light-mode-only colours.

6. **No styling in `documentation/` artifacts dictates production directly.** Prototype-imported `tokens.css` files are *inputs* to `design-style-agent`, not the final production tokens. The agent reviews them, merges them into the Shadcn convention, and the user signs off at DESIGN.

7. **Assumptions-level styling stays high-level.** During INTAKE, `assumptions.md` §2.Styling captures palette intent and font family only. Component-specific styling (button radii, card shadows, etc.) emerges at DESIGN — not at INTAKE.

---

## INTAKE Stage Behaviour

The `intake-agent` populates `assumptions.md` §2.Styling with one of two patterns:

**Pattern A — Defaulted (no source):**
```markdown
- `[DEFAULT]` Palette intent: neutral light-mode default; primary accent `#2563eb` (blue-600), neutrals from Tailwind's `slate` scale
- `[DEFAULT]` Font family: system UI stack
- `[DEFAULT]` Dark mode: not enabled (introduce later via design tokens if needed)
- `[DEFAULT]` Component-specific styling deferred to DESIGN
```

**Pattern B — Inferred from source (BRD mentions branding, prototype imports `tokens.css`, etc.):**
```markdown
- `[INFERRED]` Palette intent: dark theme with brand accents `#1A1A2E` / `#E94560` (from `documentation/design-brief.md` §Branding)
- `[INFERRED]` Font family: Inter for headings, system stack for body (from `documentation/tokens.css`)
- `[INFERRED]` Dark mode: primary mode is dark
- `[INFERRED]` Component-specific styling will be derived during DESIGN
```

The user can edit these freely during Gate 1 (free-text or direct file edit). Whatever is approved becomes the input to `design-style-agent`.

---

## DESIGN Stage Behaviour

`design-style-agent` is the enforcement point:

1. Reads `assumptions.md` §2.Styling and any user-provided `documentation/tokens.css` or `documentation/design-language.md`
2. Designs the complete `:root` and `.dark` token blocks in oklch — overriding Shadcn defaults where the user specified brand colours, keeping defaults where they didn't
3. Writes the override file to `generated-docs/specs/design-tokens.css`
4. Writes the human-readable rationale to `generated-docs/specs/design-tokens.md`
5. After user sign-off, integrates the override into `web/src/app/globals.css`

The agent must NEVER produce component-specific stylesheets — only the token layer.

---

## IMPLEMENT Stage Behaviour

The `developer` agent must enforce the rules above when writing components:

- Reach for Shadcn components first (`<Button />`, `<Card />`, etc.) — they already reference tokens via `bg-primary`, `text-primary-foreground`, etc.
- When adding new styling, use the Tailwind helper that maps to a token (`bg-muted`, `text-foreground`, `border-border`, `rounded-md`)
- If a needed value has no token, **add a token to `globals.css`** rather than hard-coding the value

If the developer agent hits a wall (the design genuinely requires a value with no semantic mapping), it should surface the question to the user rather than hard-code.

---

## QA Stage Enforcement

The `code-reviewer` agent's quality gates include a styling check. The implementation lives in `.claude/scripts/quality-gates.js`; the rule is:

- **Grep new files in `web/src/` for hex literals.** Any match outside `globals.css` fails the gate, with a remediation pointer to add a token instead.
- **Grep for inline colour functions** (`rgb(`, `rgba(`, `hsl(`, `oklch(`) outside `globals.css`. Same treatment.
- **Grep for Tailwind palette utilities** (`bg-[a-z]+-\d{3}`, `text-[a-z]+-\d{3}`, etc.) flagged as warnings (not failures) — these are tolerated in transient code but discouraged.

These checks are advisory until `design-style-agent` has produced a token override; once the override exists, they become hard gates.

---

## Forward Compatibility: `/style-update`

A future `/style-update` slash command will let users edit tokens after the project is built. Because every colour, font, radius, and shadow lives in `globals.css`, that command can:

1. Re-run `design-style-agent` against the user's new brand input
2. Diff the new token values against the existing ones
3. Write the new override into `globals.css`
4. **No component edits required** — Tailwind's JIT and Shadcn's token-based components pick up the new values automatically

If components had hard-coded values, the command would have to refactor 50+ files. With centralisation, it's one CSS file.

The `/roles-update` command has the same shape — change permissions in one place, propagate to route guards, UI visibility, and API authorization checks. Both commands depend on this policy being followed.

---

## Rationale

Without centralisation, "sensible defaults until the user specifies" scatters across whatever component happened to be implemented first. By the time the user revisits styling — usually after seeing the running app — the brand-colour change becomes a multi-file refactor, often missing instances, often introducing visual regressions because nobody saw which component used which value.

Tokens are cheap to enforce up-front and dramatically reduce the surface area of future styling work. This is a one-time policy load that pays back every time the user wants to adjust the look.
