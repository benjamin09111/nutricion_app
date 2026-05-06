# Changelog: refactor-citas-frontend

## Summary
Refactored the Appointments dashboard to improve performance, maintainability, and data integrity.

## Decisions
- Migrated from manual `useEffect` fetching to `@tanstack/react-query` for better caching and automatic refetching.
- Extracted business logic to `utils.ts` and API interaction to `useAppointmentsData` hook.
- Aligned `activityLevel` keys between frontend and backend.
- Optimized UI components to prevent unnecessary re-renders.

## Next Steps
- Monitor backend cache invalidation for working hours updates.
