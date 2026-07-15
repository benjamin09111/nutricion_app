# Antigravity — NutriNet Developer Agent

## Stack & Commands
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
  - Dev: `npm run dev`
  - Build: `npm run build`
  - Lint: `npm run lint`
- **Backend**: NestJS 11 (Modular Monolith), Prisma 5, PostgreSQL
  - Dev: `npm run start:dev`
  - Test: `npm run test`
  - Generate client: `npx prisma generate`

## Commit & PR Conventions
- **Commits**: English, concise, semantic prefix (e.g. `feat: add compliance tab`, `fix: resolve type compilation error`).
- **PRs**: English, clear summary of changes.

## Golden Rules (Immutable)
1. **No regressions**: Never break existing behaviour. Check types and run tests.
2. **No terminal without permission**: Never run shell commands without explicit approval via `run_command` tool.
3. **Read before editing**: Always read relevant files completely first.
4. **Minimal edits**: Make small surgical patches instead of big, risky rewrites.
5. **DB safety**: No destructive migrations; production data and schema types are sacred.
6. **UTF-8**: Always preserve Spanish special characters (ñ, á, é, í, ó, ú) in UI copy.
7. **Scope lock**: Only touch files and logic requested. Avoid code sprawl.
8. **UI/UX Excellence**: Premium aesthetics, HSL color palettes, no raw placeholders, precise alignment.
9. **No hardcoded URLs**: Never hardcode `localhost` or any domain-specific URLs in source code. Always use environment variables (`process.env.*`). URLs must be configurable per environment (dev, staging, production).

## Linguistic Conventions
- **UI text**: Professional, warm Spanish (español de Chile).
- **Code, comments, variables**: English.

## Core Development Triggers
When the user says **"crear un plan"** or **"terminar sesión"**, follow the rules defined in `.agents/rules/core.md`. These are always active and must be respected.

## On-Demand Knowledge
Detailed documentation and playbooks are loaded automatically on matching:
- Playbooks: `.agents/skills/<skill-name>/SKILL.md` (e.g. `nestjs-module`, `prisma-migration`, `test-jest`).
- Error registry: `.agents/memory/errores.md`.
- Deep context: `.agents/docs/` (`arquitectura-nutrinet.md`, `convenciones-api.md`).
