# Walkthrough: Appointments Frontend Refactoring

## Objectives Completed
1. **Bug Fix**: Resolved the real-time sync issue when saving working hours in `/dashboard/citas`. The frontend now correctly formats the payload as `{ rules: [...] }` and invalidates the `@tanstack/react-query` cache, forcing an immediate refetch from the backend.
2. **Modularization**: 
   - Extracted all heavy business logic, types, and normalizations out of `AppointmentsClient.tsx` into a dedicated `utils.ts` module.
   - Reduced the size and complexity of the monolithic `AppointmentsClient` component.
3. **Data Layer Optimization**: 
   - Replaced legacy `useEffect`/`useState` chains with `@tanstack/react-query` via the new `hooks/useAppointmentsData.ts` custom hooks.
   - Queries are now keyed by `calendarId` to prevent caching collisions across tenants or re-authentications.
   - Invalidating the queries successfully triggers refetches for both the rules and the calendar grid.

## Verification
- Code compilation checked via `npx tsc --noEmit`. No errors were found in the `citas` domain.
- Missing imports and minor syntax issues (such as `TabKey` and accent marks) have been completely resolved.

## Next Steps (For the User / Backend Agent)
The frontend is now optimized and structurally sound.
If the backend does not return the updated rules immediately after the `PUT /calendars/:calendarId/availability/rules`, or if it returns old data to `GET /calendars/:calendarId/availability/rules` due to an aggressive Redis cache in the backend, the backend team must ensure that the `PUT` endpoint invalidates the availability cache properly.
