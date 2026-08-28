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
10. **Border-radius consistency**: Use Tailwind standard radii matching the existing design system. Card containers use `rounded-2xl`, buttons/inputs use `rounded-xl`, and modals use `rounded-3xl`. Never use arbitrary `rounded-[2rem]` or other custom border-radius values that deviate from the project convention.
11. **Dev environment resilience**: Next.js development must run with `next dev --webpack -H 0.0.0.0` (using `--webpack` on Windows to avoid OneDrive Turbopack file locks and `-H 0.0.0.0` for LAN access). Security headers like Content-Security-Policy MUST be disabled during `development` mode so browser HMR WebSockets are never blocked.
12. **Módulo Rápido Lock & Reference**: No modificar nada en el módulo rápido (`/rapido`) a no ser que sea explícitamente solicitado. En su lugar, utilízalo como referencia obligatoria de diseño, funcionamiento, PDF generado, interfaz de usuario y menú lateral derecho para refactorizar los demás módulos.
13. **Strict Non-Destructive Seeding**: NEVER execute `deleteMany()`, `TRUNCATE`, or destructive table clear commands during seeds or migrations. All seed operations for ingredients (`/alimentos`), resources/details (`/detalles`), accounts, or plans MUST use non-destructive `upsert` or `findFirst`/`create` checks to guarantee zero data loss.
14. **Database Environment Isolation**: Local development MUST use `DATABASE_URL_DEV` and `DIRECT_URL_DEV`. Production uses only `DATABASE_URL` and `DIRECT_URL`. Never map, copy, or fall back from missing DEV variables to production. Never expose connection strings in logs, code, commits, or responses.
15. **Single Schema and Migration History**: Development and production share `backend/prisma/schema.prisma` and `backend/prisma/migrations/`. Their data may differ; their schema must not. Every schema change MUST include a reviewed migration created against DEV, applied and tested on DEV, and committed with the code.
16. **Prisma Command Safety**: Before database work, read `backend/DATABASES.md` and load the `prisma-migration` skill. Use only `npm run db:migrate:dev*` and `npm run db:check:dev` locally. Never run raw `prisma migrate dev`, `prisma db push`, `prisma migrate reset`, or production migration commands unless the documented workflow explicitly requires it and the user approves production access.
17. **Production Migration Gate**: A release containing Prisma schema changes must apply committed migrations with `prisma migrate deploy` before the new backend starts. Never generate migrations in production. Never mark migrations as applied in production without verified matching SQL. If DEV and production drift, stop deployment and reconcile through a new non-destructive migration.
18. **Production Catalog Preservation**: Production ingredients (`/alimentos`), tags/metrics (`/detalles`), resources, accounts, patients, plans, and user-created content must never be cleared or replaced by seeds, cleanup scripts, or deployment hooks. Production startup runs `db:safety:check`; do not bypass it. Seeds are DEV-only and additive (`upsert`, `findFirst`/`create`, or `createMany({ skipDuplicates: true })`).
19. **SEO, Soft 404 Prevention & Indexing Rules**:
    - **No Soft 404s**: Never render an error page with HTTP status 200 OK for missing, hidden (`gone`), or invalid dynamic entities. Always call Next.js `notFound()` to issue a real HTTP 404 Not Found response.
    - **Private Route Protection**: All internal, auth, token, or flow-specific routes (`/dashboard`, `/portal`, `/login`, `/formulario-paciente`, `/verify-email`, `/onboarding`, `/plan`, etc.) MUST explicitly export metadata with `robots: { index: false, follow: false }`.
    - **Dynamic Sitemap**: `sitemap.ts` MUST dynamically aggregate all active public entities (`/nutricionistas/${slug}`) and include all primary public landing pages (`/`, `/nutricionistas`, `/sobre-nutrinet`, `/privacy-policy`, `/terms`).
    - **Dynamic Site URL**: Always resolve site domains via `process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"`.
20. **Unified Module Typography & Layout Hierarchy (Immutable)**: Every dashboard module page MUST be wrapped in `ModuleLayout` (`src/components/shared/ModuleLayout.tsx`) to guarantee 100% unified typography and header scaling across the application. Page titles (`<h1>`) must scale at `text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`, descriptions at `text-xs sm:text-sm text-slate-500 font-medium`, section headers (`<h2>`) at `text-base sm:text-lg font-extrabold`, and cards/containers with standard `rounded-2xl` radii and `rounded-xl` buttons. Never introduce arbitrary font sizes or non-standard header styles.
21. **Patient Metrics & Biometric Progression Invariants (Immutable)**:
    - **Historical Timeline Integrity**: All biometric progress (charts, deltas, summaries, history) is 100% derived from timestamped consultations (`consultation.metrics`) ordered chronologically (`sortDate asc`).
    - **No Retroactive Overwrites**: Current profile scalars (`patient.weight`, `patient.height`) represent the active snapshot for formulas (BMI, GET/TDEE) and MUST NEVER mutate or overwrite previous historical dates.
    - **Initial Registration Invariance**: Creating a patient with initial weight/height automatically inserts an initial baseline consultation record at `patient.createdAt`, permanently securing the initial baseline point.
    - **Same-Day Metric Aggregation**: Multiple metrics logged on the same calendar date merge cleanly into that date's data point without duplicating or splitting dates.
    - **Independent Modals & Floating Popovers**: All date pickers and modal selectors must render with fixed high z-index (`z-[200]`) to ensure they remain floating, unobstructed, and unclipped by parent scroll containers.

## Linguistic Conventions
- **UI text**: Professional, warm Spanish (español de Chile).
- **Code, comments, variables**: English.

## Core Development Triggers
When the user says **"crear un plan"** or **"terminar sesión"**, follow the rules defined in `.agents/rules/core.md`. These are always active and must be respected.

## Business & Architectural Guidelines (Teacher Feedback)
Guidelines aligned with the feedback received on the project presentation (`feedback_teachers.md`):
- **User (Patient) Platform**: Future implementation of a dedicated patient portal for food logging, nutrition values, and psychological reward systems (points/stars for pauta adherence).
- **Invisible AI**: Any patient-facing AI feature (like chat) must be completely transparent; the patient must believe they are communicating directly with their nutritionist, never disclosing the AI's presence.
- **Freemium Limits (Conversion-Oriented)**: Restrict features for free plans (e.g., creation of patients allowed but no editing, no editing of plans, and strict AI usage limits). The UI must clearly indicate these "cut-off" limitations to prompt upgrade/payment.
- **Data Protection & Encryption**:
  - **End-to-End Privacy**: Patient data must be encrypted/coded internally so that *only* the assigned nutritionist can access it (admins must not have visibility).
  - **Compliance Icons**: Include a prominent "privacy & information" icon in the patients section detailing compliance with data laws, and keep Terms & Conditions updated.
- **Client Acquisition Integration**: Plan for public profiles to list nutritionists' specialties and funnel patients from gyms and other physical points.

## On-Demand Knowledge
Detailed documentation and playbooks are loaded automatically on matching:
- Playbooks: `.agents/skills/<skill-name>/SKILL.md` (e.g. `nestjs-module`, `prisma-migration`, `test-jest`).
- Error registry: `.agents/memory/errores.md`.
- Deep context: `.agents/docs/` (`arquitectura-nutrinet.md`, `convenciones-api.md`).

