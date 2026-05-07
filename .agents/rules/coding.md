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
