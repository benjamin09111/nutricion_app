# NutriNet — Project Rules for OpenCode

## What This Project Is

NutriNet is a SaaS platform for **nutritionists in Chile**. It automates the full clinical workflow: patient management → diet creation → recipe planning → shopping cart → professional PDF export.

**Stack:** Next.js 16 (frontend/) + NestJS 11 (backend/) + PostgreSQL/Prisma (backend/prisma/)

## Critical Rules (Load these on first interaction)

The following files define the project's rules and must be read when starting work. They are also loaded via `opencode.json` instructions.

### Always Active
- `.agent/rules/agent-behavior.md` — How the agent must behave (scope control, regression prevention, DB protection, speed)
- `.agent/rules/development-rules.md` — Language (EN/ES), React/Next.js patterns, types organization, forms, error handling, SEO
- `.agent/rules/engineering-standards.md` — Security, reusability, database architecture, error handling, decoupling
- `.agent/rules/product-context.md` — Domain knowledge: nutrition concepts, AI usage rules, 4-stage clinical flow, strategic vision
- `.agent/rules/tech-stack.md` — Frontend (Next.js/Tailwind), Backend (NestJS/Prisma), Cloud Functions, n8n

### Reference
- `ARCHITECTURE.md` — Full system architecture, implemented vs planned features
- `.agent/APPLICATION_FLOW.md` — Module breakdown and linear wizard flow
- `.agent/project_specs.md` — 11 system modules specification
- `.agent/roadmap.md` — Development status per module (`[x]` done, `[-]` partial, `[ ]` planned)

### Workflows (use when implementing specific modules)
- `.agent/workflows/implement-diet.md`
- `.agent/workflows/implement-foods.md`
- `.agent/workflows/implement-my-creations.md`
- `.agent/workflows/implement-patients.md`
- `.agent/workflows/implement-recipes.md`
- `.agent/workflows/implement-shopping-list.md`
- `.agent/workflows/implement-support-modules.md`
- `.agent/workflows/json-creations-standards.md`
- `.agent/workflows/new-module.md`
- `.agent/workflows/plan-permissions.md`

## Mandatory Skill

**`collaborative-dev`**: Always load this skill for any coding task. It enforces the structured session workflow defined in `.collab/rules.md` — bootstrap, lifecycle phases, approval gates, and artifacts. Never skip it.

## Collaborative Development System (`.collab/`)

ALL work in this project follows a structured session protocol. Agents and developers share state through `.collab/` artifacts. This is non-negotiable.

### How It Works
1. Every session starts by reading `.collab/active.md`
2. Every task creates a session in `.collab/sessions/<name>/`
3. Every session produces: `plan.md` → `walkthrough.md` → `changelog.md`
4. Gates require developer approval before proceeding (varies by mode)
5. All artifacts are committed to git — another developer/agent can resume exactly where you left off

### Modes
- **STRICT**: Approval at Plan, Implement, Verify, and Ship gates
- **ADAPTIVE**: Approval at Plan and Ship gates
- **TURBO**: Approval only at Ship gate

Full protocol in `.collab/rules.md`. Templates in `.collab/templates/`.

### Enforcement Rules (NON-NEGOTIABLE)

These rules apply regardless of what AI tool is being used. They are mandatory.

**Rule 0 — Session Bootstrap (DO FIRST, ALWAYS)**
- Before doing ANYTHING else, read `.collab/active.md`
- If an active session exists: resume it (read its `plan.md` and `walkthrough.md`)
- If no active session exists and work is requested: ask "What mode? STRICT / ADAPTIVE / TURBO?"
- Once mode is selected, create the session in `active.md` and begin Phase 1

**Rule 1 — Never Skip Phases**
Every task must follow this sequence:
```
Phase 1: Research   → Identify KIs, skills, files involved
Phase 2: Plan       → Create .collab/sessions/<name>/plan.md
Phase 3: Plan Gate  → STRICT/ADAPTIVE: stop and wait for approval
Phase 4: Implement  → Write code following the plan
Phase 5: Verify     → Run lint, typecheck, tests. Create walkthrough.md
Phase 6: Ship Gate  → ALL modes: ask for commit/deploy approval
Phase 7: Close      → Update active.md, create changelog.md
```

**Rule 2 — Mode Enforcement**
- STRICT: stop at Plan, Implement, Verify, and Ship gates
- ADAPTIVE: stop at Plan and Ship gates only
- TURBO: stop only at Ship gate
- After Ship Gate in ALL modes: update `active.md`, create `changelog.md`, update `.agent/roadmap.md` if feature status changed

**Rule 3 — Artifacts Must Exist**
Every session must produce:
- `plan.md` — Goal, scope, files, steps, verification plan
- `walkthrough.md` — Evidence (lint/typecheck/test output), what changed, divergences
- `changelog.md` — Summary, decisions, what's next

If a session is interrupted, commit partial artifacts. The next session resumes from them.

**Rule 4 — Developer Accountability**
- If the developer says "just do it" without specifying a mode → ask again. Do not proceed.
- If the developer approves a plan but later contradicts it → point to the approved plan.md.
- If the developer wants to abandon a session → require explicit confirmation, then move to `sessions/abandoned/`.

**Rule 5 — Git Integration**
- All `.collab/sessions/` files MUST be committed to git.
- `active.md` acts as a mutex: only ONE active session at a time.
- Before starting new work, verify no other developer has an active session in `active.md`.
- If `active.md` shows someone else's session → warn and suggest coordination.

## Behavioral Mandates

### DB Protection (CRITICAL)
- NEVER delete or modify existing production data
- NEVER run destructive migrations without explicit user approval
- Existing data in the database is used by real people — treat it as sacred

### Frontend
- Use `cursor-pointer` on ALL interactive elements
- Never use native `alert()`, `prompt()`, or `confirm()` — use `<ConfirmationModal>` or toast
- Modals must NOT close on backdrop click or Escape — only via explicit button
- Backend drives all heavy logic; frontend is a shallow consumer
- Use semantic HTML (`<main>`, `<section>`, `<nav>`, etc.) over `<div>` soup

### Backend
- NestJS Modular Monolith: each domain in `backend/src/modules/<name>/`
- Prisma ORM with hybrid schema: typed columns for identity, Json for flexible content
- Validation via DTOs with `class-validator`
- Never put business logic in controllers — always in services
- Event-driven decoupling: modules emit events, don't call each other directly

### Project-specific Skills
The project has skills in `.agent/skills/` and `.opencode/skills/`. Load them via the `skill` tool when relevant.

## Key Architecture Insight

The clinical flow follows 4 sequential stages:

```
Dieta → Recetas y Porciones → Carrito → Entregable
```

A `Project` entity links Patient + active Creation IDs for each stage. The system supports both linear wizard mode and standalone module mode.
