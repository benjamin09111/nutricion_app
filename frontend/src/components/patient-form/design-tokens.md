# Design Tokens — Patient Form

Palette based on existing NutriNet brand (emerald/indigo dual-theme).

## Card Styles
- **Base card**: `bg-white border border-neutral-200 rounded-xl p-5`
- **Calculated metrics block**: `bg-accent-50 rounded-lg p-4`
- **Badge (calculated)**: `bg-success-50 text-success-800 text-xs rounded px-2 py-0.5`

## Typography
- Labels: `text-sm text-gray-600`
- Values: `text-2xl font-medium`
- Section titles: `text-base font-medium`
- Helper text: `text-xs text-gray-500`

## Borders & Radii
- No decorative shadows or gradients
- 1px borders throughout
- `rounded-lg` (8px) for controls
- `rounded-xl` (12px) for cards

## Layout
- Cards use `max-w-2xl` for content containment
- Form footer uses `max-w-2xl` with `flex justify-between mt-4`

## Implementation
These tokens are applied in all patient-form components. Colors use existing emerald palette from globals.css (emerald-50 through emerald-700).
