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

## File Boundaries & Modularization (Strict Rule)
- **Zero Monolithic Components**: Never write or expand components into monolithic "super-files" (e.g. over 400 lines). Break down layouts, modals, and views into separate sub-components.
- **Strict Separation of Concerns**:
  - **UI Render**: Components in `src/app` or `src/features/components` should focus *only* on rendering.
  - **State & Logic**: Complex React states, API calls, and handlers *must* be extracted into custom React hooks (e.g. `useRecipes.ts`).
  - **Business Rules & Math**: Formula calculations, PDF builders, and helper logic must be placed in pure helper files under `src/lib/` or `features/.../utils`.
- **Enforce the `features/` Directory**: Do not write feature-specific components or local utilities inside the Next.js `app/` folder. Place modular hooks, sub-components, and types inside `src/features/<feature-name>/`.
- **Continuous Refactoring**: If an existing component is massive (such as RecipesClient or PatientDetailClient), any new change or fix should be used as an opportunity to extract and modularize its pieces rather than making the file larger.
- **Ease of Collaboration**: Code must be modular so multiple developers can edit different parts of the same view without causing git merge conflicts.
