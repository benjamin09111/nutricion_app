# Contrato del Frontend para el Servicio de Citas

Este documento describe exactamente cómo el frontend de NutriNet consume el servicio de citas, qué headers manda, qué rutas usa y qué flujos dependen de autenticación.

La idea es que este archivo sirva para revisar por qué aparece un error de auth en el servicio y verificar si el contrato real del frontend coincide con lo que el backend espera.

## Resumen corto

- El frontend siempre intenta enviar `X-Tenant-ID`.
- En modo `jwt`, el frontend también envía `Authorization: Bearer <auth_token>` si existe sesión.
- El módulo de citas pasa por un proxy local en `/api/appointments/*`, que reenvía la request al servicio real.
- El dashboard de citas usa endpoints privados como `/calendars/me`, `/slots`, `/requests` y `/booking-links`.
- La página pública de reserva usa `/booking-links/:token` y `/booking-links/:token/requests`.

## Variables de entorno relevantes

### Frontend general

- `NEXT_PUBLIC_API_URL`
- `TENANT_ID`
- `NEXT_PUBLIC_TENANT_ID`

### Servicio de citas

- `APPOINTMENTS_API_BASE_URL`
- `APPOINTMENTS_AUTH_MODE`
- `NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE`

### Estado actual esperado en local

```env
TENANT_ID="nutri-app"
NEXT_PUBLIC_TENANT_ID="nutri-app"
APPOINTMENTS_API_BASE_URL="http://localhost:3030"
APPOINTMENTS_AUTH_MODE="public"
NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE="jwt"
```

## Cómo viaja el tenant

El frontend usa `X-Tenant-ID` en dos lugares:

### 1. Requests generales de la app

El wrapper de API del frontend agrega `X-Tenant-ID` automáticamente en `fetchApi`.

Archivo:
- [frontend/src/lib/api-base.ts](./frontend/src/lib/api-base.ts)

### 2. Requests al servicio de citas

El proxy local de citas reenvía la request y vuelve a inyectar `X-Tenant-ID`.

Archivo:
- [frontend/src/app/api/appointments/[[...path]]/route.ts](./frontend/src/app/api/appointments/[[...path]]/route.ts)

### Header enviado

```http
X-Tenant-ID: nutri-app
```

## Cómo viaja la autenticación

### Modo JWT

Si el frontend está configurado con:

```env
NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE="jwt"
```

entonces el cliente de citas agrega:

```http
Authorization: Bearer <auth_token>
```

Ese `auth_token` sale de:

- cookie `auth_token`
- `localStorage.auth_token`

### Modo público

Si el modo está en `public`, no se fuerza el bearer.

## Endpoints que usa el frontend

### Dashboard de citas

El frontend del nutri usa estos endpoints contra el servicio de citas:

- `GET /calendars/me`
- `GET /calendars/:calendarId/view/week?weekStart=...`
- `GET /calendars/:calendarId/appointments?from=...&to=...`
- `GET /appointments?calendarId=:calendarId&from=...&to=...`
- `GET /calendars/:calendarId/slots?from=...&to=...&durationMin=...`
- `GET /availability/free-slots?calendarId=:calendarId&from=...&to=...`
- `GET /calendars/:calendarId/requests?status=REQUESTED`
- `GET /appointments?calendarId=:calendarId&status=REQUESTED`
- `POST /appointments`
- `POST /calendars/:calendarId/google-calendar/connect`
- `PUT /calendars/:calendarId/availability/rules`
- `POST /calendars/:calendarId/booking-links`

### Reserva pública por enlace

La página pública usa:

- `GET /booking-links/:token`
- `POST /booking-links/:token/requests`
- `GET /calendars/:calendarId/slots?from=...&to=...&durationMin=...`

## Flujo del dashboard de citas

### 1. Carga inicial

Al abrir `/dashboard/citas`, el frontend:

1. Llama a `GET /calendars/me`.
2. Si encuentra calendario, carga:
   - semana actual
   - slots
   - requests
   - citas

### 2. Crear cita manual

El modal `Crear cita` manda este body a `POST /appointments`:

```json
{
  "calendarId": "...",
  "title": "Consulta nutricional",
  "patientName": "...",
  "patientEmail": "...",
  "patientId": "...",
  "start": "2026-05-01T14:00:00.000Z",
  "end": "2026-05-01T14:30:00.000Z",
  "durationMin": 30,
  "notes": "...",
  "status": "confirmed",
  "timeZone": "America/Santiago",
  "notifyPatientByEmail": true
}
```

### 3. Compartir mi horario

El botón `Compartir mi horario` crea un booking link con:

`POST /calendars/:calendarId/booking-links`

Body esperado por el frontend:

```json
{
  "calendarId": "...",
  "nutritionistId": "...",
  "nutritionistName": "...",
  "title": "Horario de ...",
  "description": "Comparte este enlace para que tus pacientes reserven una cita sobre tu calendario actual.",
  "timeZone": "America/Santiago",
  "metadata": {
    "source": "NutriNet",
    "module": "appointments"
  }
}
```

El frontend espera una respuesta que le devuelva:

- `token`, o
- `url`, o
- `data.token`, o
- `data.bookingToken`

Con eso arma la URL pública:

```text
/portal/citas/:nutritionistId/:token
```

## Flujo de la página pública

La ruta pública es:

```text
/portal/citas/[nutriId]/[token]
```

### 1. Carga del enlace

El frontend llama:

```http
GET /booking-links/:token
```

Con eso obtiene:

- calendario asociado
- nombre del nutricionista
- zona horaria
- metadatos opcionales

### 2. Carga de slots

Luego llama:

```http
GET /calendars/:calendarId/slots?from=...&to=...&durationMin=...
```

### 3. Registro de cita

Cuando el paciente elige un bloque libre, el frontend manda:

```http
POST /booking-links/:token/requests
```

Body enviado:

```json
{
  "calendarId": "...",
  "nutriId": "...",
  "nutritionistId": "...",
  "patientName": "Nombre completo",
  "fullName": "Nombre completo",
  "name": "Nombre completo",
  "patientEmail": "correo@ejemplo.com",
  "email": "correo@ejemplo.com",
  "patientPhone": "+56...",
  "phone": "+56...",
  "reason": "Motivo de la consulta",
  "title": "Motivo de la consulta",
  "notes": "Notas opcionales",
  "message": "Motivo de la consulta",
  "start": "2026-05-01T14:00:00.000Z",
  "end": "2026-05-01T14:30:00.000Z",
  "timeZone": "America/Santiago",
  "timezone": "America/Santiago",
  "notifyPatientByEmail": true,
  "source": "booking-link"
}
```

## Qué campos son obligatorios en el frontend público

El frontend exige:

- nombre completo
- correo
- motivo de la consulta
- horario seleccionado

El teléfono y las notas son opcionales.

## Qué campos usa el frontend para identificar al paciente

En la cita manual del dashboard:

- `patientEmail` es el dato clave para notificación y referencia.
- `patientId` se puede completar al importar un paciente.

En la reserva pública:

- el correo vuelve a ser el identificador principal visible para el nutri
- el nombre y el motivo viajan en el body de la solicitud

## Qué esperamos que haga el backend

Si el servicio está bien alineado con el frontend, debería:

- aceptar `X-Tenant-ID: nutri-app`
- validar JWT solo en los endpoints privados
- dejar públicos los endpoints de booking link si el flujo lo requiere
- devolver `401` solo cuando realmente falte o sea inválida la sesión
- devolver `404` cuando el booking link no exista
- devolver `409` cuando el slot ya no esté disponible

## Señales de que el error está en el servicio y no en el frontend

Si aparece:

- `El servicio de citas rechazó la autenticación`

entonces el frontend ya intentó:

- mandar tenant
- mandar JWT cuando corresponde

Si aun así falla, lo más probable es que el backend:

- no esté leyendo el JWT esperado
- espere otro header o secret
- esté protegiendo un endpoint que el frontend trata como público
- no esté reconociendo el tenant recibido

## Archivos involucrados

- [frontend/src/lib/api-base.ts](./frontend/src/lib/api-base.ts)
- [frontend/src/lib/appointments.ts](./frontend/src/lib/appointments.ts)
- [frontend/src/app/api/appointments/[[...path]]/route.ts](./frontend/src/app/api/appointments/[[...path]]/route.ts)
- [frontend/src/app/dashboard/citas/AppointmentsClient.tsx](./frontend/src/app/dashboard/citas/AppointmentsClient.tsx)
- [frontend/src/app/portal/citas/[nutriId]/[token]/BookingLinkClient.tsx](./frontend/src/app/portal/citas/[nutriId]/[token]/BookingLinkClient.tsx)

