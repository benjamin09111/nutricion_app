# NutriNet Coding Standards (Compressed)

## Architecture & Logic
- **Modularity**: Logic in Services. Validation in DTOs. Presentation in Components.
- **Backend-Driven**: All heavy logic resides in NestJS.
- **Prisma**: Typed queries. Optimize selects (no over-fetching).

## Frontend (Next.js/React)
- **Styling**: TailwindCSS 4. Maintain Indigo/Green/Ivory palette.
- **Components**: Functional only (no React.FC). Reuse existing UI.
- **UX**: All interactive elements MUST have `cursor-pointer`.

## Guidelines
- **Simple & Direct**: Prefer professional industry patterns over custom complexity.
- **Maintainability**: Clean code. Clear English comments.
- **Integrity**: NO unsolicited renames/moves. Preserve UTF-8 Spanish text.

## File Boundaries
- **Single Responsibility**: One file should solve one cohesive concern.
- **Size Budget**: If a file starts getting large or mixing data fetching, state, UI, and business rules, split it.
- **Extraction Rule**: Pull repeated logic into helpers/hooks/services instead of growing a single component or service.
- **Review Trigger**: Treat files approaching a few hundred lines as a signal to refactor, not as a target to keep extending.
- **Preferred Outcome**: Smaller files that are easy for another agent or person to read, test, and change quickly.
