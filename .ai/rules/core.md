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
1. **Pre-Flight**: Check /.ai/checks/preflight.md.
2. **Context**: Check /.ai/context/glossary.md for Clinical Flow (Dieta -> Recetas -> Carrito).
3. **Execute**: Minimal, modular implementation.
4. **Post-Flight**: Check /.ai/checks/postflight.md.

## AI Memory & Evolution
- **Access**: NO direct modification of `/.ai/` files allowed.
- **Proposals**: Use `/.ai/evolution/proposals.md` for improvements (minimal, specific).
- **Approval**: Wait for USER approval before any `.ai` update.
- **Mistakes**: Log repeated errors in `/.ai/feedback.md`.

*Ref: AGENTS.md for full behavioral mandates.*

