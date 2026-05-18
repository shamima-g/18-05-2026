# Prototype Source Reference Contract

Single source of truth for how downstream agents (developer, feature-planner, test-designer, design-wireframe-agent) consume `documentation/prototype-src/` and `generated-docs/specs/wireframes/_component-reference.md` on prototype-imported projects.

**Detecting Component Reference Mode:** If `generated-docs/specs/wireframes/_component-reference.md` exists, the project was imported from a prototype. Each screen section in that document names a source file at `documentation/prototype-src/<path>`.

---

## Rules (apply to every consumer)

1. **Read the prototype source file directly** when you need layout, fields, validation, navigation, or business content for a screen. The component reference document is an index; the named source file is the source of truth. Do **not** re-infer content from the reference doc's summary.

2. **Quote business content verbatim.** Error messages, declaration text, helper copy, labels, and placeholders in the prototype are user-visible content — often legal/UX-reviewed. Capture them exactly, not paraphrased.

3. **Do NOT port `documentation/prototype-src/components/ui/`.** Those are custom prototype primitives. Use the project's shadcn UI components (via the shadcn MCP server) instead. The component reference doc explicitly flags this.

4. **State management — adapt the shape, don't copy calls.** Prototypes typically use Zustand with localStorage persistence. Capture slice names, fields, transitions, and the persistence intent; map onto the project's actual state library and persistence target (server-side in production).

5. **Treat every `prototypeShortcuts` entry as an anti-pattern.** Hardcoded data arrays, `"Sign here"` placeholder divs, raw card-data fields, client-side-only validation, simulated API calls — each shortcut needs the production equivalent (API fetch, real signature capture, hosted payment provider, server-side validation). FRS CR-gaps flagged in the reference doc (CR-required content absent from the prototype) require **added** content from the FRS, not silent inheritance of the prototype's gap.

---

## Consumer-specific spin

Each consuming agent links to this file and adds one short note about how the rules land in its own work product:

- **`feature-planner`** — each `prototypeShortcuts` entry typically becomes its own story (or extends one). CR-gaps each need an explicit story; do not let them silently drop.
- **`test-designer`** — every shortcut maps to a `(BA-N)` decision block; verbatim error messages and declaration text become test-design examples.
- **`design-wireframe-agent`** (Component Reference Mode) — produces the index doc that the rules above are *about*. The doc must name the source file, list the `prototypeShortcuts`, and flag CR-gaps so downstream agents can apply rules 1–5.
- **`developer`** — apply rules 1–5 during implementation. Replace shortcuts with production equivalents; add FRS-required content the prototype is missing.
