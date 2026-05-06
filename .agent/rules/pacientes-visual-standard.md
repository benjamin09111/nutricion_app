---
trigger: always_on
description: Canonical visual standard based on the dashboard/pacientes experience
---

# Pacientes Visual Standard

This project must use the `/dashboard/pacientes` experience as the visual reference for new screens, refactors, and module extensions.

## Canonical Reference
- Treat `dashboard/pacientes` as the default UI north star.
- When a module differs from this look, move it toward the patients standard.
- If there is uncertainty, prefer the patients pattern over introducing a new visual language.
- Use the patients palette as the source of truth: `indigo` as the main accent, `verde` for positive states, and `ivory` as the tertiary/light surface tone.
- Avoid introducing unrelated accent families such as `amber`, `orange`, `yellow`, `rose`, or `pink` unless they are part of an intentional clinical warning system.

## Core Visual Principles
- **Light typography**: prefer `font-normal`, `font-medium`, and `font-semibold`.
- **Avoid heavy text**: do not default to `font-bold` or `font-black` for large areas of content.
- **Readable size**: keep base text comfortable and restrained; avoid oversized labels unless they are intentional counters or primary actions.
- **Minimal density**: prioritize whitespace, short blocks, and clear separation.
- **Soft surfaces**: use white cards, subtle borders, gentle shadows, and rounded corners.
- **Friendly hierarchy**: section titles should feel clear, not loud.
- **Controlled accent color**: use accent colors sparingly for actions, state, and focus.
- **Progressive disclosure**: collapse secondary information when possible.

## Layout Rules
- Prefer a clean page shell with a clear header, a compact action row, and content cards below.
- Use balanced horizontal padding and comfortable vertical spacing.
- Keep filters compact and visually light.
- Let tables and core content breathe instead of filling every pixel with controls.
- Avoid stacked panels that feel heavy unless they are genuinely necessary.
- Build surfaces with Tailwind utility classes and existing palette tokens instead of ad hoc colors.
- If a status chip or badge needs emphasis, keep it within the indigo/green/ivory family first.

## Component Behavior
- Default to reusable dashboard patterns already present in `pacientes`.
- Use subtle tabs, pills, and segmented controls instead of bulky selectors.
- Use compact summary cards for counts and status.
- Keep primary actions visible, but avoid making every action look equally important.
- Prefer one clear path per section; hide alternate actions behind secondary controls when possible.

## Typography Guidance
- Headings: restrained weight, clear spacing, short line length.
- Body text: neutral, calm, and readable.
- Labels: smaller, precise, and not visually dominant.
- Numeric stats: only use stronger weight when the number itself is the focal point.

## Prohibited Patterns
- No crowded layouts with too many nested borders.
- No overuse of bold, black, or uppercase text.
- No oversized cards that waste vertical space.
- No decorative elements that distract from the task.
- No warm accent drift: avoid yellow, orange, amber, rose, or pink as default dashboard accents.
- No “flashy” dashboard styling that fights readability.

## Implementation Rule
- When creating or editing any dashboard module, first ask: "Would this feel at home in `/dashboard/pacientes`?"
- If the answer is no, adjust spacing, typography, hierarchy, and controls until it does.
