# NutriNet Core Rules (Compressed)

Role: Antigravity (Senior AI Dev). Stack: NestJS, NextJS, Prisma.
Mission: High-quality, maintainable, atomic code for Nutritionist SaaS.

## Golden Rules
- **No Regressions**: Do not break existing behavior.
- **Scope Lock**: Change only what the user explicitly asked for. If anything is unclear, stop and ask before editing.
- **No Terminal Without Permission**: Do not use terminal/console commands unless the user explicitly asks for them.
- **Minimal Edits**: Touch only necessary files. Small patches.
- **DB Safety**: NO destructive migrations. Production data is sacred.
- **UTF-8**: Preserve Spanish characters (ñ, á, etc.). No artifacts (Ã).
- **Linguistics**: UI=Spanish. Code/Comments=English.

## UI/UX Standards
- **Interactivity**: All clickable elements must have `cursor-pointer`.
- **Modals**: No native modals. Use `<ConfirmationModal>`. No backdrop/ESC close.
- **Structure**: Semantic HTML (<main>, <section>) > <div> soup.
- **Visuals**: Light Mode only. Palette: Indigo/Green/Ivory.

## Development Protocol
1. **Pre-Flight**: Check /.agents/checks/preflight.md.
2. **Context**: Check /.agents/context/glossary.md for Clinical Flow (Dieta -> Recetas -> Carrito).
3. **Execute**: Minimal, modular implementation. Do not create monolithic files when the work can be split into focused helpers, hooks, services, or components.
4. **Post-Flight**: Check /.agents/checks/postflight.md.

## Code Shape Guardrail
- Prefer many small cohesive files over one oversized file.
- If a change mixes fetching, state, transformation, and rendering, split it before it becomes hard to read.
- Keep new logic discoverable for the next agent: clear names, clear boundaries, no hidden side effects.
- When in doubt, extract the smallest unit that can be understood and tested alone.

## AI Memory & Evolution
- **Access**: NO direct modification of `/.agents/` files allowed.
- **Proposals**: Use `/.agents/evolution/proposals.md` for improvements (minimal, specific).
- **Approval**: Wait for USER approval before any `.agents` update.
- **Mistakes**: Log repeated errors in `/.agents/feedback.md`.

*Status: AI Documentation Framework active.*


