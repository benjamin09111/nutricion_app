# Appointments Service

## Purpose
Centralized appointment service for NutriNet today, designed to be moved later into a central app without changing frontend consumers.

## Current Shape
- Frontend calls `GET/POST /api/appointments/*`.
- The Next.js proxy forwards to the backend service.
- The backend owns persistence today through Prisma.
- The same contract will later point to an external service via `.env`.

## Environment Flags
- `APPOINTMENTS_API_BASE_URL`: external service URL. If empty, NutriNet uses the local backend.
- `APPOINTMENTS_API_KEY`: future service auth key.
- `NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE`: auth mode used by the client proxy.

## Core Rules
- Requests are always `REQUESTED`.
- Acceptance converts the appointment to `CONFIRMED`.
- Rejection converts the appointment to `REJECTED`.
- `CANCELLED`, `REJECTED`, `COMPLETED`, and `NO_SHOW` do not block time slots.
- `REQUESTED`, `SCHEDULED`, and `CONFIRMED` block time slots.

## Domain Flows
### Public profile
- The patient chooses an available slot.
- The system creates a request.
- The nutri receives an email.
- The patient receives a receipt email.

### Patient portal
- Same request flow, reused through the same service.
- The patient identity comes from the portal session.

### Dashboard
- The nutri sees pending requests.
- Approve changes state to `CONFIRMED` and sends confirmation email.
- Reject changes state to `REJECTED` and sends rejection email.

## Data Model Notes
- `Appointment` stores the booking itself.
- `metadata` holds flexible integration data such as source, guest email, and audit timestamps.
- `AppointmentCalendar` stores working hours and timezone.
- `AppointmentTimeSlot` stores weekly availability.

## Service Methods
- `getOrCreateCalendar(nutritionistId)`
- `getCalendarWithSchedule(calendarId, nutritionistId)`
- `updateAvailabilityRules(calendarId, nutritionistId, payload)`
- `getAvailabilityRules(calendarId, nutritionistId)`
- `getFreeSlots(query)`
- `requestAppointment(nutritionistId, input)`
- `createAppointment(nutritionistId, input)`
- `approveAppointment(nutritionistId, appointmentId, startTime?, endTime?)`
- `rejectAppointment(nutritionistId, appointmentId, reason?)`
- `listAppointments(query)`
- `getPendingAppointments(nutritionistId)`

## Future Migration To Central App
When moved, NutriNet should only change:
- `APPOINTMENTS_API_BASE_URL`
- `APPOINTMENTS_API_KEY`

No UI rewrite should be needed if the contract remains stable.

## Non-Goals For MVP
- Google Calendar sync.
- WhatsApp reminders.
- Automatic self-confirmation by the patient.
- Complex rescheduling workflows.
