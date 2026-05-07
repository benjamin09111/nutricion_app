# Confirmed Technical Patterns

Stable patterns approved by the USER to reduce future decision logic.

## UI & Forms
- **Validation**: React Hook Form + Zod.
- **Location**: Schemas in `frontend/src/lib/validators/`.

## API & Data
- **Centralization**: All calls via `frontend/src/lib/api.ts`.
- **State**: TanStack Query (v5).

## Backend
- **Pattern**: Service-as-Repository. Logic isolation.
