# Plan Frontend: conectar `/dashboard/citas` con `backend services`

## Resumen

El frontend debe tratar `services` como backend único para citas, disponibilidad, requests, booking links y estado de Google Calendar. La integración completa requiere dos superficies:

- **Privada `/dashboard/citas`** para nutri/host/staff: horario, calendario, próximas, aceptar/rechazar, crear citas, compartir link, conectar Google.
- **Pública `/portal/citas/[nutriId]/[token]`** para pacientes: ver disponibilidad y pedir cita por link.

El frontend debe alinearse al contrato real actual del backend, no al payload histórico de `mifrontend.md`. Hoy hay diferencias de nombres y rutas, así que el plan incluye una **capa adaptadora frontend** para normalizar datos y evitar que la UI dependa de DTOs crudos.

## Cambios de implementación

### 1. Infraestructura de conexión
- Crear un cliente único `appointmentsApi` con:
  - `APPOINTMENTS_API_BASE_URL`
  - `X-Tenant-ID`
  - `Authorization: Bearer <token>` solo en rutas privadas
  - lectura de `X-Request-Id` para logs UI/debug
- Mantener proxy local tipo `frontend/src/app/api/appointments/[[...path]]/route.ts` para que el frontend no hable directo al servicio desde el navegador.
- Definir `.env.example` frontend con:
  - `APPOINTMENTS_API_BASE_URL`
  - `NEXT_PUBLIC_TENANT_ID`
  - `NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE`
- Implementar un mapper de errores común:
  - `401` fuerza login
  - `403` muestra permisos
  - `404` calendario/link no existe
  - `409` slot ya no disponible
  - `410` link expirado/usado
  - `422` validación por campo
  - `5xx` mensaje genérico + `requestId`

### 2. Capa adaptadora de contratos
- Crear tipos frontend propios: `UiCalendar`, `UiSlot`, `UiRequest`, `UiAppointment`, `UiGoogleStatus`, `UiBookingLink`.
- Normalizar respuestas backend:
  - `GET /calendars/:id/view/week|day` debe mapear `appointments`, `requests`, `blocks`, `externalBusy`
  - `GET /calendars/:id/google/status` debe mapear `connected`, `syncStatus`, `lastSyncedAt`, `lastSyncError`, `watchExpiresAt`
- Normalizar payloads salientes al backend actual:
  - crear cita manual con `guestName`, `guestEmail`, `startAt`, `endAt`, `title`, `description`, `calendarId`
  - crear request pública con `guestName`, `guestEmail`, `guestPhone`, `message`, `startAt`, `endAt`
  - crear booking link con `mode`, `fixedStartAt`, `fixedEndAt`, `durationMin`, `allowedUses`, `expiresAt`, `metadata`, `autoAccept`
- No seguir usando los nombres viejos del documento `mifrontend.md` como `patientName`, `start`, `end`, `google-calendar/connect`; encapsular compatibilidad en el adaptador si todavía existen llamadas heredadas.

### 3. Dashboard `/dashboard/citas`
- Estructurar la pantalla en 5 vistas:
  - `Calendario`
  - `Próximas`
  - `Solicitudes`
  - `Horario`
  - `Google`
- **Calendario**
  - cargar `GET /calendars/me`
  - seleccionar calendario activo
  - cargar `GET /calendars/:id/view/week?weekStart=...`
  - renderizar 4 capas distintas: citas confirmadas, solicitudes pendientes, bloques manuales, ocupación externa `externalBusy`
  - acciones rápidas: crear cita, cancelar cita, abrir request, crear bloqueo
- **Próximas**
  - usar `GET /appointments?status=CONFIRMED`
  - listar próximas citas del usuario autenticado con acceso rápido a cancelar o abrir en calendario
- **Solicitudes**
  - usar `GET /calendars/:id/requests?status=REQUESTED`
  - acciones `POST /requests/:id/accept`, `POST /requests/:id/reject`, `POST /requests/:id/cancel`
  - al aceptar/rechazar, refrescar `requests`, `view/week` y `slots`
- **Horario**
  - editar reglas semanales con `PUT /calendars/:id/availability/rules`
  - crear/listar/eliminar bloqueos con:
    - `POST /calendars/:id/availability/blocks`
    - `GET /calendars/:id/availability/blocks?from&to`
    - `DELETE /calendars/availability/blocks/:blockId`
  - después de guardar, invalidar cache de `slots` y `view`
- **Google**
  - conectar con `POST /calendars/:id/google/connect`
  - actualizar integración con `PATCH /calendars/:id/google/integration`
  - ver estado con `GET /calendars/:id/google/status`
  - reintentar sync con `POST /calendars/:id/google/resync`
  - mostrar último error, último sync y expiración del watch

### 4. Compartir horario y pedir citas
- **Compartir horario desde dashboard**
  - crear booking link con `POST /calendars/:id/booking-links`
  - si backend devuelve solo `token`, el frontend debe construir la URL pública
  - guardar en UI `token`, URL pública y metadatos del link
- **Página pública `/portal/citas/[nutriId]/[token]`**
  - cargar link con `GET /booking-links/:token`
  - usar `calendarId` del link para cargar `GET /calendars/:id/slots?from&to&durationMin`
  - crear request con `POST /booking-links/:token/requests`
  - mostrar confirmación clara de “solicitud enviada” y contemplar `409/410`
- **Pedir citas directas sin link**
  - si el calendario es público, permitir `GET /calendars/:id/slots` y `POST /calendars/:id/requests`
  - si no es público, solo por link o sesión host/staff

### 5. Estado, cache y UX
- Usar una capa de datos tipo SWR o React Query para:
  - `calendars/me`
  - `view/week|day`
  - `slots`
  - `requests`
  - `appointments`
  - `google/status`
- Invalidaciones obligatorias:
  - aceptar/rechazar/cancelar request
  - crear/cancelar cita
  - editar reglas
  - crear/eliminar block
  - conectar o resync Google
- Timezone:
  - calcular week/day en `calendar.timeZone`
  - fallback a `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Mostrar `externalBusy` como “ocupado por Google” o “ocupado externo”, nunca como cita editable local.

## APIs e interfaces que el frontend debe consumir

- **Calendars**
  - `GET /calendars/me`
  - `GET /calendars/:id`
  - `PATCH /calendars/:id`
- **Availability**
  - `PUT /calendars/:id/availability/rules`
  - `GET /calendars/:id/availability/rules`
  - `POST /calendars/:id/availability/blocks`
  - `GET /calendars/:id/availability/blocks?from&to`
  - `DELETE /calendars/availability/blocks/:blockId`
- **Views y slots**
  - `GET /calendars/:id/view/day?date=...`
  - `GET /calendars/:id/view/week?weekStart=...`
  - `GET /calendars/:id/slots?from=...&to=...&durationMin=...`
- **Requests**
  - `POST /calendars/:id/requests`
  - `GET /calendars/:id/requests?status=REQUESTED`
  - `GET /requests/:requestId`
  - `POST /requests/:requestId/accept`
  - `POST /requests/:requestId/reject`
  - `POST /requests/:requestId/cancel`
- **Appointments**
  - `GET /appointments`
  - `POST /appointments`
  - `PATCH /appointments/:id`
  - `DELETE /appointments/:id`
- **Booking links**
  - `POST /calendars/:id/booking-links`
  - `GET /booking-links/:token`
  - `POST /booking-links/:token/requests`
- **Google**
  - `POST /calendars/:id/google/connect`
  - `PATCH /calendars/:id/google/integration`
  - `GET /calendars/:id/google/status`
  - `POST /calendars/:id/google/resync`
  - `GET /calendars/:id/google/diagnostics`

## Plan de pruebas frontend

- Smoke privado:
  - listar calendarios
  - cargar semana actual
  - ver `appointments`, `requests`, `blocks`, `externalBusy`
  - editar horario y ver cambio reflejado en `slots`
  - aceptar/rechazar una solicitud y ver refresco inmediato
  - crear booking link y abrir URL pública
  - conectar Google y visualizar `syncStatus`
- Smoke público:
  - abrir link válido
  - ver slots
  - pedir cita
  - recibir `409` si el slot se ocupa
  - recibir `410` si el link expiró o ya se usó
- Casos visuales:
  - semana con ocupados externos Google
  - calendario sin requests
  - calendario sin Google conectado
  - error de sync Google con `lastSyncError`
- Logs UI:
  - confirmar que errores guardan `requestId`, endpoint y payload resumido en consola/dev logger

## Supuestos

- El frontend real parece ser Next.js y el contrato heredado está descrito en [mifrontend.md](C:\Users\Benjamin\Desktop\services\mifrontend.md); este plan asume esa base.
- El frontend debe adaptarse al backend actual de `services`, no al contrato viejo tal cual.
- Para v1, “mandar citas” se resuelve con dos caminos:
  - crear cita manual desde dashboard
  - compartir booking links para que el paciente solicite la cita
