# NutriNet Core Rules (Compressed)

Role: Antigravity (Senior AI Dev). Stack: NestJS, NextJS, Prisma.
Mission: High-quality, maintainable, atomic code for Nutritionist SaaS.

## Golden Rules
- **No Regressions**: Do not break existing behavior.
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
3. **Execute**: Minimal, modular implementation.
4. **Post-Flight**: Check /.agents/checks/postflight.md.

## AI Memory & Evolution
- **Access**: NO direct modification of `/.agents/` files allowed.
- **Proposals**: Use `/.agents/evolution/proposals.md` for improvements (minimal, specific).
- **Approval**: Wait for USER approval before any `.agents` update.
- **Mistakes**: Log repeated errors in `/.agents/feedback.md`.

*Status: AI Documentation Framework active.*


