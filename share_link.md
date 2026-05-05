Tutorial para el frontend

El nutricionista crea el link público desde el dashboard.
POST /calendars/:calendarId/booking-links

Headers:

X-Tenant-ID: <tenant-slug>
Authorization: Bearer <token>
Content-Type: application/json
Body sugerido:

{
  "mode": "FLEXIBLE",
  "allowedUses": 1,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "metadata": {
    "source": "dashboard",
    "module": "appointments"
  }
}
Respuesta:

el backend devuelve el token del link, y el frontend arma la URL pública con eso.
El frontend público abre el link compartido.
GET /booking-links/:token

Headers:

X-Tenant-ID: <tenant-slug>
Esto devuelve la info del link y el calendarId asociado. Con ese calendarId, el frontend ya puede cargar disponibilidad.

El frontend pide los bloques disponibles del calendario.
GET /calendars/:calendarId/slots?from=...&to=...&durationMin=...

Headers:

X-Tenant-ID: <tenant-slug>
Ejemplo:

/calendars/cmons3ev70000hcv14o9l8929/slots?from=2026-05-04T00:00:00.000Z&to=2026-05-10T23:59:59.999Z&durationMin=60

La UI debe:

mostrar solo los slots donde isAvailable = true
desactivar o esconder los que vengan con reason
cuando el usuario hace click en un bloque, usar ese startAt y endAt
El paciente manda la solicitud de cita.
POST /booking-links/:token/requests

Headers:

X-Tenant-ID: <tenant-slug>
Content-Type: application/json
Body esperado:

{
  "guestName": "Juan Perez",
  "guestEmail": "juan@email.com",
  "guestPhone": "+56912345678",
  "startAt": "2026-05-06T14:00:00.000Z",
  "endAt": "2026-05-06T15:00:00.000Z",
  "message": "Quiero una consulta por nutrición",
  "bookingLinkId": "opcional-si-lo-tienen-en-ui"
}
En este backend, message es la descripción/motivo de la cita. Si tu frontend hoy usa description, cámbialo a message o mapea description -> message antes de enviar.

Qué debe hacer la UI

mostrar los bloques disponibles
permitir seleccionar uno
pedir nombre, email y mensaje
enviar startAt y endAt del bloque elegido
mostrar confirmación al guardar
si recibe 409, el bloque ya no está disponible
si recibe 410, el link expiró o ya se usó
Importante

El frontend público también debe mandar X-Tenant-ID, porque el controller de booking links pasa por TenantGuard.
La disponibilidad no debe salir de reglas estáticas del frontend; debe venir de GET /calendars/:calendarId/slots.
El calendario semanal del nutricionista no se materializa día por día: el backend genera slots por rango a partir de reglas semanales, así que la UI solo consume ese resultado y lo pinta.
Resumen corto para tu agente frontend

Crear link con POST /calendars/:calendarId/booking-links
Abrir link con GET /booking-links/:token
Cargar bloques con GET /calendars/:calendarId/slots
Enviar cita con POST /booking-links/:token/requests
Usar message como descripción del motivo
Mandar siempre X-Tenant-ID