# Appointments Central Migration

## Goal
Move the current appointments capability out of NutriNet and into the central Laravel app with minimal consumer changes.

## What Moves
- Calendar storage
- Availability rules
- Slot generation
- Request / approve / reject flows
- Appointment email notifications
- Audit traces and metadata

## What Stays In NutriNet
- UI screens
- Frontend hooks and components
- Proxy route under `/api/appointments/*`

## Migration Strategy
1. Keep the frontend contract stable.
2. Point `APPOINTMENTS_API_BASE_URL` to the central app.
3. Keep the same statuses and payloads.
4. Verify emails, slot blocking, and approval/rejection semantics.
5. Remove the local backend implementation only after parity is proven.

## Compatibility Rules
- Do not change status names.
- Do not change required headers without a migration window.
- Do not change the shape of booking request payloads.
- Preserve `metadata` for traceability.
