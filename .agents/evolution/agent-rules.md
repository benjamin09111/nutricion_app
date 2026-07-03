# Agent Working Rules

These rules are for future coding sessions in NutriNet.

## Default Behavior
- Read the relevant files before editing.
- Keep changes small and focused.
- Never modify unrelated code or files; if the requested scope is unclear, ask before editing.
- Do not open or use terminal commands unless the user explicitly asks for them.
- Prefer fixing the root cause over adding guards or wrappers.
- Do not refactor unrelated code while cleaning warnings.

## Quality Bar
- Build and lint after meaningful batches of changes.
- Treat errors as blockers.
- Treat warnings as debt only if they are low risk or high leverage to remove.
- Avoid introducing new unused imports, variables, or `async` wrappers.

## Repo Hygiene
- Preserve existing behavior unless the user explicitly asks for a change.
- Keep code in small, cohesive units.
- Use descriptive names and avoid hidden side effects.
- When a warning is easy to remove safely, remove it immediately.

## Communication
- Report blockers early.
- Call out when a cleanup is postponed because it is large or risky.
- Prefer a clean stop over speculative edits.
