# Antigravity — NutriNet Project Rules

## Ponytail Minimalist Senior Developer Guidelines
- **YAGNI First:** Do not write any code unless it is strictly necessary.
- **Decision Ladder:** Before writing/editing any code, check:
  1. Does this need to exist at all?
  2. Is it already in the codebase?
  3. Does the standard library do it?
  4. Is there a native platform feature?
  5. Is there an already-installed dependency?
  6. Can it be a single line?
- **Minimal Changes:** Always make surgical, minimal modifications. Do not over-engineer.
- **Safety Boundaries:** Keep strict validations, security checks, error boundaries, and accessibility. Do not skip essential safety.
- **Preserve User Edits (Immutable):** Never remove, overwrite, or erase custom classes (e.g. `mt-18`), layout tweaks, or manual code additions made by the user. Always respect and retain user edits strictly.
- **Database Workflow (Immutable):** Before any Prisma or database task, read `../backend/DATABASES.md` and the root `AGENTS.md` database rules. Development uses only `_DEV` URLs; production uses standard URLs. Schema changes require one committed migration history shared by both environments.
- **SEO & Soft 404 Prevention (Immutable):** Always return HTTP 404 (`notFound()`) for missing or hidden dynamic resources. Keep private/auth/token pages on `noindex`, maintain dynamic `sitemap.ts`, and use `process.env.NEXT_PUBLIC_APP_URL`.
- **Unified Module Typography & Layout (Immutable):** All dashboard module pages MUST be wrapped in `ModuleLayout` (`src/components/shared/ModuleLayout.tsx`) to enforce 100% unified typography across NutriNet (`<h1>` title `text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`, description `text-xs sm:text-sm text-slate-500 font-medium`, section `<h2>` `text-base sm:text-lg font-extrabold`, cards `rounded-2xl`, buttons `rounded-xl`). Never invent custom header sizes or non-standard font scaling.
- **Patient Metrics & Biometric Progress Invariants (Immutable):** Biometric timelines (charts, deltas, summaries, Excel/PDF exports) are derived purely from timestamped consultations (`consultation.metrics`) sorted chronologically. Current profile scalars (`weight`, `height`) are current snapshots only and must NEVER overwrite or mutate historical dates. Date pickers must always use fixed floating positioning (`z-[200]`) to prevent clipping.
