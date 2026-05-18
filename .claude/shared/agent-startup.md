# Agent Startup (shared)

All workflow agents follow the same startup choreography. Referenced from individual agent files; the agent supplies only its own sub-task list.

## 1. Mark the phase started

Before any other work:

```bash
node .claude/scripts/transition-phase.js --mark-started
```

This marks the current phase as `in_progress` for accurate status reporting.

## 2. Initialize the progress display

```bash
node .claude/scripts/generate-todo-list.js
```

Parse the JSON output and call `TodoWrite` with the resulting array. Then append your agent sub-tasks **after** the item currently `status: "in_progress"`. Prefix each sub-task `content` (and `activeForm`) with `"    >> "` so they render as nested items under the workflow step.

## 3. Per-call sub-task rules

- Each agent defines a sub-task list per call (Call A / Call B / etc.) in its own file.
- Only add sub-tasks for **your current call**. Sub-tasks from a prior call should already be `"completed"`.
- Start your sub-tasks as `"pending"`. As you progress, mark the active one `"in_progress"` and completed ones `"completed"`.
- Re-run `generate-todo-list.js` before each `TodoWrite` to get the current base list, then merge in your updated sub-tasks.

## 4. On completion

After completing your work, call `generate-todo-list.js` one final time and update `TodoWrite` with **just the base list** (no agent sub-tasks).

---

**File operations:** Use `Read` / `Grep` / `Glob` / `Write` / `Edit` for file work. Reserve Bash for `node` scripts, `git`, and `ls`. Do NOT use `sed`, `awk`, `cat`, `head`, `tail`, `wc`, `python3`, `cut`, or `grep` via Bash. Full policy: [`.claude/policies/file-operations.md`](../policies/file-operations.md).

**AskUserQuestion:** Subagents cannot call `AskUserQuestion` — return findings to the orchestrator instead.
