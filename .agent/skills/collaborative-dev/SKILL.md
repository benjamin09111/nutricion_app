---
name: collaborative-dev
description: Structured collaborative development workflow for agents and developers working asynchronously. Use this skill for EVERY task in this project. Enforces session lifecycle, approval gates, and artifact creation so multiple agents/developers can work without losing state.
---

# Collaborative Development System

This project uses a structured workflow so agents and developers can work asynchronously without losing context. Every piece of work leaves a trail that anyone else can pick up.

## Why This Exists

- Developer A starts a feature on Monday with OpenCode
- Developer B continues it on Tuesday with Antigravity
- Developer A finishes it on Wednesday with Codex

All three sessions share state through `.collab/`. Nobody starts from zero. Nobody overwrites anyone else's work.

## How It Works (for Developers)

1. When you start working, tell the agent what you want to do.
2. The agent asks: "What mode? STRICT / ADAPTIVE / TURBO?"
   - **STRICT** = you approve every step. Best for risky changes.
   - **ADAPTIVE** = you approve the plan, then the agent executes. Best for most work.
   - **TURBO** = you only approve the final commit. Best for well-understood tasks.
3. The agent creates a session in `.collab/sessions/<name>/` and tracks everything.
4. Every session produces three files:
   - `plan.md` — what will be done, before coding starts
   - `walkthrough.md` — what was done, with lint/typecheck evidence
   - `changelog.md` — summary and decisions for the next person
5. When you're done, commit the session files. Another developer's agent can resume from them.

## How It Works (for Agents)

### Bootstrap (ALWAYS FIRST)
```
Read .collab/active.md
  → Active session?   RESUME it (read plan.md + walkthrough.md)
  → No session?       ASK mode, create session, begin Research
```

### Lifecycle (NEVER SKIP)
```
Phase 1: RESEARCH    → Identify relevant rules, workflows, skills, files
Phase 2: PLAN        → Create plan.md (goal, scope, steps, verification)
Phase 3: PLAN GATE   → STRICT/ADAPTIVE: present plan, WAIT for approval
Phase 4: IMPLEMENT   → Write code following the approved plan
Phase 5: VERIFY      → Run lint + typecheck, create walkthrough.md
Phase 6: SHIP GATE   → ALL modes: present walkthrough, WAIT for approval
Phase 7: CLOSE       → Update active.md, create changelog.md, commit
```

### Gates (When to Stop and Wait)

| Phase | STRICT | ADAPTIVE | TURBO |
|-------|--------|----------|-------|
| After planning | STOP | STOP | Continue |
| Before coding | STOP | Continue | Continue |
| After verification | STOP | Continue | Continue |
| Before commit/ship | STOP | STOP | STOP |

### Artifacts (Must Exist per Session)

- `plan.md` — Goal, scope, files, steps, risks, verification commands
- `walkthrough.md` — Every file changed, lint output, typecheck output, test output, divergences
- `changelog.md` — Summary, decisions, files changed, what's next, roadmap updates

If a session is interrupted, commit partial artifacts. The next session resumes from them.

### Rules for Agents

1. NEVER proceed past a gate without explicit user confirmation.
2. NEVER create a new session if `active.md` has someone else's active session.
3. NEVER write code before creating `plan.md` (except in TURBO mode).
4. ALWAYS commit session artifacts to git.
5. ALWAYS update `.agent/roadmap.md` if a module status changes.

## How It Works (First Time Setup for Developers)

When you clone this repo for the first time:

1. Your AI tool (OpenCode, Antigravity, Codex) reads `AGENTS.md` automatically.
2. `AGENTS.md` tells it to load this skill (`collaborative-dev`).
3. The skill teaches both you and the agent how the workflow works.
4. That's it. No configuration needed. The `.collab/` directory and this skill handle everything.
