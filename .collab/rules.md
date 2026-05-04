# Collaborative Development — Enforcement Rules

These rules are **non-negotiable**. They ensure agents and developers stay synchronized through structured session artifacts.

## Rule 0: Session Bootstrap (MANDATORY)

At the start of EVERY session, before doing ANYTHING else:

1. Read `.collab/active.md`
2. If an active session exists:
   - Read the session's `plan.md` and `walkthrough.md` (if they exist)
   - Announce: "Resuming session [name] — Phase: [current phase]"
   - Pick up where it left off
3. If no active session exists and the user asks for work:
   - Ask: "What mode? STRICT / ADAPTIVE / TURBO?"
   - Once mode is selected, create the session in `active.md`
   - Begin Phase 1: Research

## Rule 1: Session Lifecycle (NEVER SKIP)

Every task must follow this sequence. Phases cannot be skipped.

```
Phase 1: Research     → Identify KIs, skills, files involved
Phase 2: Plan         → Create .collab/sessions/<name>/plan.md
Phase 3: Approval Gate→ In STRICT/ADAPTIVE: stop and ask for approval
Phase 4: Implement    → Write code following the plan
Phase 5: Verify       → Run lint, typecheck, tests. Create walkthrough.md
Phase 6: Ship Gate    → Ask for commit/deploy approval (ALL modes)
Phase 7: Close        → Update active.md, create changelog.md
```

## Rule 2: Mode Enforcement

- **STRICT**: Stop at Plan Gate, Implement Gate, Verify Gate, and Ship Gate. Wait for explicit user approval at each.
- **ADAPTIVE**: Stop at Plan Gate and Ship Gate. Code and verify freely after plan is approved.
- **TURBO**: Only stop at Ship Gate. Plan, code, and verify freely.
- After Ship Gate in ALL modes: update `active.md` (mark complete), create `changelog.md`, update `.agent/roadmap.md` if feature status changed.

## Rule 3: Artifacts (NEVER LEAVE EMPTY)

Every session directory MUST contain:

| File | Created in Phase | Content |
|------|-----------------|---------|
| `plan.md` | Phase 2 | What will be done, files affected, verification plan |
| `walkthrough.md` | Phase 5 | Evidence (lint output, test results), what changed, screenshots |
| `changelog.md` | Phase 7 | Summary of what was done, decisions made, what's next |

If a phase is in progress and the session ends, the artifact must be committed to git in its partial state.

## Rule 4: Developer Accountability

- If the developer says "just do it" without specifying a mode → ask again. Do not proceed.
- If the developer approves a plan but later contradicts it → point to the approved plan.md.
- If a task spans multiple sessions → the next session resumes via `active.md`. Never start fresh if there's an active session.
- If the developer wants to abandon a session → require explicit confirmation, then move session to `sessions/abandoned/`.

## Rule 5: Git Integration

- All `.collab/sessions/` files MUST be committed to git.
- The `active.md` file acts as a mutex — only one active session at a time.
- Before starting a new session, verify no other developer has an active session in `active.md`.
- If `active.md` shows someone else's session → warn: "⚠️ [Name] has an active session: [session]. Wait or coordinate."
