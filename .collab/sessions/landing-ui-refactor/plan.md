# Plan: Landing Page UI Refactor - Correct Section Order

## Goal
Fix section order and add missing sections to match mockup images precisely.

## Files Changed
- `frontend/src/app/page.tsx` - Section structure and order
- `frontend/src/content/landing.json` - Content structure with all sections

## Correct Section Order
1. **Hero** → AHORRA TIEMPO / Atiende más pacientes
2. **Features** (3ra imagen) → Simple cards with colored icons (Automatización con IA, Dashboard Profesional, Máxima Seguridad)
3. **OPCIÓN 1** (1ra imagen) → Purple-bordered cards with subtitles and highlights
4. **OPCIÓN 2** (2da imagen) → Purple-bordered cards with different subtitles
5. **Planes** → Beta phase announcement
6. **Registro** → Form with purple card
7. **Footer** → nutrinet branding

## Key Changes
- Added Features section (simple cards) as first section after hero
- Added OPCIÓN 1 section with highlights (pill-shaped text)
- Added OPCIÓN 2 section with different content
- Maintained Planes, Registro, and Footer sections
- Alternating backgrounds for visual separation

## Verification Plan
- Visual check against all mockup images
- Dark mode toggle functionality
- Form submission still works
- No TypeScript errors

## Mode: ADAPTIVE
