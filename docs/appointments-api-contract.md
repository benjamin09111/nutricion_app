# Appointments API Contract

## Base Contract
All clients should talk to appointments through `/api/appointments/*`.

## Expected Headers
- `Authorization: Bearer <token>`
- `X-Tenant-ID: nutrinet`
- `X-Nutritionist-Id: <nutritionist-id>`
- `X-Request-Id: <optional-request-id>`

## Endpoints
### Calendar
- `GET /calendars/me`
- `POST /calendars/me`
- `POST /calendars/me/default-schedule`
- `GET /calendars/:id`
- `PUT /calendars/:id/schedule`
- `PUT /calendars/:id/availability/rules`
- `GET /calendars/:id/availability/rules`

### Availability
- `GET /availability/free-slots?calendarId=&from=&to=&durationMin=`

### Requests and appointments
- `POST /booking-links/:token/requests`
- `POST /public/nutritionists/:slug/appointments/request`
- `POST /portal/me/appointments/request`
- `GET /appointments`
- `POST /appointments`
- `GET /appointments/pending`
- `POST /appointments/:appointmentId/approve`
- `POST /appointments/:appointmentId/reject`

## Request Payloads
### Booking request
```json
{
  "guestName": "Paciente Uno",
  "guestEmail": "paciente@example.com",
  "guestPhone": "+56911111111",
  "message": "Primera consulta",
  "startAt": "2026-06-16T15:00:00.000Z",
  "endAt": "2026-06-16T16:00:00.000Z"
}
```

## State Machine
```txt
REQUESTED -> CONFIRMED
REQUESTED -> REJECTED
CONFIRMED -> CANCELLED
CONFIRMED -> COMPLETED
CONFIRMED -> NO_SHOW
```

## Blocking Rules
- Block: `REQUESTED`, `SCHEDULED`, `CONFIRMED`
- Do not block: `REJECTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`

## Email Side Effects
- On request: email nutri + receipt to patient.
- On approve: email patient confirmation.
- On reject: email patient rejection.

## Notes For Future Laravel App
- Keep the same request/response payloads.
- Keep the same status names.
- Keep slot and conflict rules identical.
- Maintain `metadata` for cross-app tracing.
