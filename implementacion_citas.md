# Guia maestra para implementar un sistema de citas

Esta guia describe como replicar un sistema de citas simple y robusto como el que tenemos actualmente: el dueño modifica su calendario, terceros ven horarios disponibles, piden una cita dejando datos de contacto, y el dueño acepta o rechaza esas solicitudes.

El objetivo es que otro agente pueda implementar el servicio rapidamente en otra aplicacion sin reintroducir errores comunes de disponibilidad, rutas, estados o UX.

## 1. Objetivo del sistema

El sistema debe permitir:

- Que el dueño configure sus horarios laborales o bloques disponibles.
- Que usuarios externos vean esos horarios disponibles desde una pagina publica o portal.
- Que usuarios externos soliciten una cita entregando datos de contacto.
- Que la solicitud quede en estado pendiente y no bloquee automaticamente el calendario.
- Que el dueño vea solo las solicitudes pendientes y pueda aceptarlas o rechazarlas.
- Que al aceptar una solicitud se transforme en una cita confirmada y bloquee el horario.
- Que al rechazar una solicitud no bloquee el horario.
- Que al cancelar una cita confirmada el horario vuelva a quedar disponible.

La version minima no necesita calendario externo, pagos, notificaciones avanzadas ni videollamadas. Si existen, deben ser extensiones del flujo base, no dependencias obligatorias.

## 2. Principios clave

- Separar solicitudes de citas confirmadas.
- Una solicitud pendiente no debe bloquear disponibilidad.
- Solo citas confirmadas o agendadas deben bloquear horarios.
- Validar disponibilidad en el backend, nunca confiar solo en el frontend.
- Revalidar disponibilidad en el ultimo instante antes de crear o aceptar una cita.
- Mostrar siempre fecha y hora en las solicitudes pendientes.
- Evitar doble click en acciones destructivas o mutaciones: aceptar, rechazar, cancelar.
- Mantener errores claros para el usuario final.
- Mantener una sola fuente de verdad para solicitudes pendientes.

## 3. Estados recomendados

Usar estados explicitos para evitar ambiguedad:

```ts
type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "SCHEDULED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";
```

Reglas:

- `REQUESTED`: solicitud pendiente. No bloquea el calendario.
- `CONFIRMED`: cita aceptada. Bloquea el calendario.
- `SCHEDULED`: equivalente a confirmada si la app usa ese estado. Bloquea el calendario.
- `REJECTED`: solicitud rechazada. No bloquea.
- `CANCELLED`: cita cancelada. No bloquea.
- `COMPLETED` y `NO_SHOW`: historicos. Normalmente no bloquean slots futuros.

Estados bloqueantes:

```ts
const BLOCKING_APPOINTMENT_STATUSES = ["CONFIRMED", "SCHEDULED"];
```

No incluir `REQUESTED` en los estados bloqueantes.

## 4. Modelo de datos minimo

### Calendar

Representa el calendario del dueño.

Campos recomendados:

- `id`
- `ownerId`
- `name`
- `timeZone`
- `createdAt`
- `updatedAt`

Regla importante:

- Si la zona horaria no existe o viene como `UTC`, normalizarla a la zona principal del negocio. Para Chile, usar `America/Santiago`.

### AppointmentTimeSlot

Representa disponibilidad semanal recurrente del dueño.

Campos recomendados:

- `id`
- `calendarId`
- `dayOfWeek`: numero de 0 a 6, donde 0 es domingo.
- `hour`: hora local, 0 a 23.
- `isAvailable`: boolean.

Este modelo funciona bien si el producto solo necesita bloques por hora. Si se necesitan bloques de 15 o 30 minutos, cambiar `hour` por `startMinuteOfDay` y `endMinuteOfDay`.

### Appointment

Representa tanto solicitudes como citas aceptadas.

Campos recomendados:

- `id`
- `calendarId`
- `patientId` o `contactId`, opcional.
- `patientName` o `guestName`.
- `title`.
- `description`.
- `startTime`.
- `endTime`.
- `status`.
- `notes`.
- `metadata`, JSON opcional.
- `createdAt`.
- `updatedAt`.

Metadata recomendada para solicitudes publicas:

```json
{
  "source": "public-profile",
  "guestEmail": "persona@mail.com",
  "guestPhone": "+56912345678",
  "ownerId": "owner-id"
}
```

Guardar los datos de contacto en metadata permite recibir solicitudes de personas que todavia no existen como pacientes o contactos internos.

## 5. Flujos principales

### 5.1. El dueño modifica su calendario

Flujo:

1. El dueño abre la pantalla de calendario.
2. La app carga su calendario con disponibilidad semanal.
3. El dueño activa o desactiva bloques horarios.
4. El frontend envia la nueva configuracion al backend.
5. El backend reemplaza o actualiza los `AppointmentTimeSlot` del calendario.
6. El portal publico usa esos slots para calcular horarios visibles.

Endpoint sugerido:

```http
PUT /calendars/:calendarId/schedule
```

Payload sugerido:

```json
{
  "slots": [
    { "dayOfWeek": 1, "hour": 9, "isAvailable": true },
    { "dayOfWeek": 1, "hour": 10, "isAvailable": true }
  ]
}
```

Reglas:

- Validar que el calendario pertenece al dueño autenticado.
- No permitir modificar calendarios de otro dueño.
- Guardar horas como horas locales del calendario, no como UTC.
- Convertir a UTC solo al generar fechas concretas de citas.

### 5.2. El publico ve disponibilidad

Flujo:

1. Un usuario externo entra al perfil publico o portal.
2. El frontend pide disponibilidad para un rango de fechas.
3. El backend toma los slots semanales disponibles.
4. El backend convierte esos slots a fechas reales en la zona horaria del calendario.
5. El backend descuenta citas bloqueantes existentes.
6. El frontend muestra solo slots disponibles.

Endpoint sugerido:

```http
GET /availability/free-slots?calendarId=...&from=2026-06-20&to=2026-06-27&durationMin=60
```

Respuesta sugerida:

```json
{
  "slots": [
    {
      "start": "2026-06-20T13:00:00.000Z",
      "end": "2026-06-20T14:00:00.000Z",
      "available": true
    }
  ]
}
```

Reglas:

- `start` y `end` deben viajar como ISO UTC.
- El frontend debe formatear fecha y hora usando la zona horaria del calendario.
- No mostrar slots del pasado.
- Si se quiere evitar reservas para el mismo dia, solo mostrar desde mañana.
- Descontar solo citas con estados `CONFIRMED` o `SCHEDULED`.
- No descontar solicitudes `REQUESTED`.

### 5.3. Un usuario externo pide una cita

Flujo:

1. El usuario elige un horario visible.
2. Completa datos de contacto.
3. El frontend envia la solicitud.
4. El backend valida fechas, duracion, propiedad del calendario y disponibilidad.
5. El backend revalida disponibilidad dentro de una transaccion justo antes de crear.
6. El backend crea una cita con estado `REQUESTED`.
7. El horario sigue disponible para otros hasta que el dueño acepte una solicitud.
8. El dueño ve la solicitud en su panel.

Endpoint sugerido:

```http
POST /booking-links/:token/requests
```

O, si no hay booking links:

```http
POST /public/calendars/:calendarId/requests
```

Payload sugerido:

```json
{
  "guestName": "Benjamin",
  "guestEmail": "benja@mail.com",
  "guestPhone": "+56912345678",
  "message": "Quiero agendar una evaluacion inicial",
  "startAt": "2026-06-20T13:00:00.000Z",
  "endAt": "2026-06-20T14:00:00.000Z"
}
```

Validaciones backend obligatorias:

- `guestName` requerido.
- `guestEmail` requerido.
- `startAt` y `endAt` validos.
- `endAt > startAt`.
- Duracion dentro del rango permitido, por ejemplo 5 a 60 minutos.
- La fecha no debe ser pasada.
- Si la regla de producto lo exige, solo permitir desde mañana.
- El slot debe estar dentro de la disponibilidad laboral.
- El slot no debe chocar con una cita bloqueante.
- La validacion final debe ocurrir dentro de transaccion.

Ejemplo de patron para evitar inconsistencias:

```ts
await db.transaction(async (tx) => {
  const conflict = await tx.appointment.findFirst({
    where: {
      calendarId,
      status: { in: ["CONFIRMED", "SCHEDULED"] },
      startTime: { lt: end },
      endTime: { gt: start }
    }
  });

  if (conflict) {
    throw new Error("Ese horario ya no esta disponible");
  }

  return tx.appointment.create({
    data: {
      calendarId,
      patientName: guestName,
      title: `Solicitud de cita - ${guestName}`,
      description: message || "Solicitud de cita pendiente de confirmacion",
      startTime: start,
      endTime: end,
      status: "REQUESTED",
      metadata: {
        source: "public-profile",
        guestEmail,
        guestPhone
      }
    }
  });
}, { isolationLevel: "Serializable" });
```

Si el ORM/base de datos no soporta aislamiento serializable, implementar al menos:

- Relectura de conflictos inmediatamente antes de crear.
- Indice o constraint adicional si el modelo permite bloquear rangos.
- Manejo de errores de concurrencia con mensaje claro.

### 5.4. El dueño ve solicitudes pendientes

Flujo:

1. El dueño entra al panel de citas.
2. El frontend pide solicitudes del calendario.
3. La tabla muestra fecha, hora, nombre, motivo y acciones.
4. El dueño puede aceptar o rechazar.

Endpoint sugerido:

```http
GET /calendars/:calendarId/requests
```

Respuesta sugerida:

```json
{
  "events": [
    {
      "id": "appointment-id",
      "title": "Solicitud de cita - Benjamin",
      "patientName": "Benjamin",
      "description": "Quiero agendar una evaluacion inicial",
      "start": "2026-06-20T13:00:00.000Z",
      "end": "2026-06-20T14:00:00.000Z",
      "status": "REQUESTED",
      "metadata": {
        "guestEmail": "benja@mail.com",
        "guestPhone": "+56912345678"
      }
    }
  ]
}
```

UI minima obligatoria:

- Columna `Fecha`.
- Columna `Hora`.
- Columna `Paciente` o `Nombre`.
- Columna `Motivo`.
- Acciones `Aceptar` y `Rechazar`.

No omitir la hora. Si la solicitud muestra solo fecha, el dueño no puede decidir correctamente.

### 5.5. El dueño acepta una solicitud

Flujo:

1. El dueño presiona `Aceptar`.
2. El frontend deshabilita el boton mientras carga.
3. El backend busca la solicitud por `appointmentId`, `calendarId` y estado `REQUESTED`.
4. El backend calcula el horario final.
5. El backend revalida conflictos dentro de una transaccion.
6. Si el horario sigue libre, cambia el estado a `CONFIRMED`.
7. Esa cita empieza a bloquear el calendario.
8. El frontend refresca solicitudes y calendario.

Endpoint sugerido:

```http
POST /calendars/appointments/:appointmentId/approve
```

Payload opcional:

```json
{
  "startTime": "2026-06-20T13:00:00.000Z",
  "endTime": "2026-06-20T14:00:00.000Z"
}
```

Si el payload no trae fechas, usar las fechas originales de la solicitud.

Validaciones obligatorias:

- La cita debe existir.
- Debe pertenecer al calendario del dueño autenticado.
- Debe estar en estado `REQUESTED`.
- `endTime > startTime`.
- No debe chocar con citas `CONFIRMED` o `SCHEDULED`.
- La verificacion de conflicto y el update deben estar en la misma transaccion.

Ejemplo:

```ts
await db.transaction(async (tx) => {
  const appointment = await tx.appointment.findFirst({
    where: {
      id: appointmentId,
      calendarId,
      status: "REQUESTED"
    }
  });

  if (!appointment) {
    throw new Error("Cita solicitada no encontrada");
  }

  const conflict = await tx.appointment.findFirst({
    where: {
      calendarId,
      id: { not: appointmentId },
      status: { in: ["CONFIRMED", "SCHEDULED"] },
      startTime: { lt: appointment.endTime },
      endTime: { gt: appointment.startTime }
    }
  });

  if (conflict) {
    throw new Error("Ese horario ya no esta disponible");
  }

  return tx.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      metadata: {
        confirmedAt: new Date().toISOString()
      }
    }
  });
}, { isolationLevel: "Serializable" });
```

### 5.6. El dueño rechaza una solicitud

Flujo:

1. El dueño presiona `Rechazar`.
2. El frontend deshabilita el boton mientras carga.
3. El backend busca la cita `REQUESTED` del dueño.
4. Cambia el estado a `REJECTED`.
5. El slot no queda bloqueado.
6. El frontend refresca la lista.

Endpoint sugerido:

```http
POST /calendars/appointments/:appointmentId/reject
```

Payload sugerido:

```json
{
  "reason": "No tengo disponibilidad ese dia"
}
```

La razon puede ser opcional.

### 5.7. El dueño cancela una cita confirmada

Flujo:

1. El dueño abre el detalle de una cita confirmada.
2. Presiona `Cancelar cita`.
3. El frontend deshabilita el boton y muestra `Cancelando...`.
4. El backend busca una cita `CONFIRMED` o `SCHEDULED` del dueño.
5. Cambia el estado a `CANCELLED`.
6. La cita deja de bloquear el horario.
7. El frontend cierra el modal y refresca.

Endpoint sugerido:

```http
POST /calendars/appointments/:appointmentId/cancel
```

Regla UX importante:

- Bloquear doble click. Si no se bloquea, el primer request cancela y el segundo puede responder 404 porque la cita ya no esta en estado cancelable.

## 6. Endpoints maestros

Una implementacion clara puede usar estos endpoints:

```http
GET  /calendars/me
POST /calendars/me
PUT  /calendars/:calendarId/schedule
GET  /calendars/:calendarId/requests
GET  /calendars/:calendarId/view/week
POST /calendars/:calendarId/appointments
POST /calendars/appointments/:appointmentId/approve
POST /calendars/appointments/:appointmentId/reject
POST /calendars/appointments/:appointmentId/cancel
GET  /availability/free-slots
POST /booking-links/:token/requests
```

Evitar mezclar rutas sin criterio. Un bug comun es que el frontend llame:

```http
POST /appointments/:appointmentId/approve
```

cuando el backend realmente expone:

```http
POST /calendars/appointments/:appointmentId/approve
```

Definir una tabla de rutas y hacer que frontend y backend coincidan exactamente.

## 7. Calculo de disponibilidad

Para calcular slots libres:

1. Leer el calendario y su zona horaria.
2. Leer `AppointmentTimeSlot` disponibles.
3. Para cada fecha del rango, identificar el dia de la semana en la zona horaria del calendario.
4. Convertir cada hora local disponible a UTC.
5. Buscar citas bloqueantes entre `from` y `to`.
6. Marcar como ocupado cualquier slot que se solape con cita bloqueante.
7. Devolver solo slots libres o devolver todos con `available: true/false`.

Solape correcto:

```ts
const overlaps = existing.startTime < requestedEnd && existing.endTime > requestedStart;
```

No usar comparaciones como `startTime === requestedStart`, porque no detectan solapes parciales.

## 8. Manejo de zona horaria

Reglas:

- Guardar citas concretas como UTC en base de datos.
- Guardar disponibilidad semanal como hora local del calendario.
- Convertir local a UTC al generar slots reales.
- Formatear fechas en frontend usando la zona horaria del calendario.
- No usar la zona horaria del navegador para decidir disponibilidad del calendario.

Ejemplo de formateo frontend:

```ts
new Intl.DateTimeFormat("es-CL", {
  timeZone: calendarTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
}).format(new Date(slot.start));
```

## 9. UX minima recomendada

### Portal publico

Debe incluir:

- Selector de dia.
- Lista de horarios disponibles.
- Formulario con nombre, email, telefono opcional y mensaje opcional.
- Boton `Solicitar cita`.
- Estado de carga.
- Mensaje claro si el horario ya no esta disponible.

Validacion frontend:

- No permitir enviar sin nombre.
- No permitir enviar sin email.
- No permitir enviar sin slot seleccionado.
- Deshabilitar el boton mientras se envia.

El frontend ayuda, pero el backend decide.

### Panel del dueño

Debe incluir:

- Vista para editar horarios laborales.
- Vista de citas confirmadas.
- Vista de solicitudes pendientes.
- Badge con cantidad de pendientes.
- Fecha y hora visibles en pendientes.
- Botones `Aceptar` y `Rechazar`.
- Modal o detalle para cancelar citas confirmadas.

Acciones con carga:

- `Aceptar`: deshabilitar mientras acepta.
- `Rechazar`: deshabilitar mientras rechaza.
- `Cancelar cita`: deshabilitar mientras cancela y mostrar `Cancelando...`.

## 10. Errores esperados y mensajes

Mensajes sugeridos:

- Slot ocupado: `Ese horario ya no esta disponible`.
- Fecha invalida: `Fechas invalidas`.
- Fin antes del inicio: `La cita debe terminar despues de iniciar`.
- Sin contacto: `Nombre y correo son requeridos para solicitar una cita`.
- No autorizado: `No tienes permisos para esta accion`.
- Recurso inexistente: `El recurso solicitado no existe o fue eliminado`.

Recomendacion:

- Para conflictos de disponibilidad usar HTTP 400 o 409.
- Para recursos que no pertenecen al dueño usar 404 o 403 segun politica de seguridad.
- Para rutas inexistentes revisar primero si frontend y backend estan desalineados.

## 11. Seguridad y propiedad

Cada endpoint privado debe resolver el dueño autenticado desde el token o contexto de sesion.

Nunca confiar en un `ownerId` enviado desde el frontend para decidir propiedad.

Patron recomendado:

```ts
const ownerId = await resolveOwnerIdFromRequest(request);
const calendar = await db.calendar.findFirst({
  where: { id: calendarId, ownerId }
});

if (!calendar) {
  throw new NotFoundException("Calendario no encontrado");
}
```

Esto previene IDOR: que un usuario manipule calendarios o citas de otro.

## 12. Checklist de implementacion backend

- Crear modelo `Calendar`.
- Crear modelo `AppointmentTimeSlot`.
- Crear modelo `Appointment`.
- Crear enum o union de estados.
- Implementar `getOrCreateCalendar(ownerId)`.
- Implementar `updateSchedule(calendarId, ownerId, slots)`.
- Implementar `getFreeSlots(calendarId, from, to, durationMin)`.
- Implementar `requestAppointment(...)` con transaccion y revalidacion final.
- Implementar `listRequests(calendarId, ownerId)` filtrando `REQUESTED`.
- Implementar `approveAppointment(ownerId, appointmentId)` con transaccion y revalidacion final.
- Implementar `rejectAppointment(ownerId, appointmentId)`.
- Implementar `cancelAppointment(ownerId, appointmentId)`.
- Asegurar que `REQUESTED` no bloquea slots.
- Asegurar que `CONFIRMED` y `SCHEDULED` bloquean slots.
- Agregar mensajes de error claros.
- Agregar pruebas o verificacion manual de solapes.

## 13. Checklist de implementacion frontend

- Crear cliente API centralizado para citas.
- Crear hook para calendario actual.
- Crear hook para disponibilidad semanal.
- Crear hook para slots libres publicos.
- Crear hook para solicitudes pendientes.
- Crear acciones `approve`, `reject`, `cancel`, `create/request`.
- Mostrar pendientes con fecha y hora.
- Refrescar calendario y solicitudes despues de aceptar, rechazar o cancelar.
- Deshabilitar botones durante mutaciones.
- Mostrar spinner o texto de carga.
- Mostrar errores de disponibilidad de forma entendible.
- Evitar fallback silencioso a endpoints legacy salvo que exista una razon real.

## 14. Casos borde obligatorios

Probar manualmente:

- Dos usuarios piden el mismo slot desde el portal casi al mismo tiempo.
- El dueño acepta una solicitud cuando ya existe otra cita confirmada en ese horario.
- El dueño hace doble click en `Aceptar`.
- El dueño hace doble click en `Rechazar`.
- El dueño hace doble click en `Cancelar cita`.
- El portal muestra un slot y luego alguien lo ocupa antes de enviar.
- Una solicitud pendiente no bloquea el slot.
- Una cita confirmada si bloquea el slot.
- Una cita cancelada libera el slot.
- Las horas se ven correctas para la zona horaria del calendario.
- El frontend llama exactamente a las rutas que existen en backend.

## 15. Errores de desarrollo que hay que evitar

- Mostrar solicitudes pendientes sin hora.
- Hacer que `REQUESTED` bloquee disponibilidad.
- Validar disponibilidad solo cuando se renderizan los slots.
- No revalidar disponibilidad al crear la solicitud.
- No revalidar disponibilidad al aceptar.
- Aceptar una solicitud sin transaccion.
- Permitir doble click en acciones.
- Llamar rutas equivocadas desde frontend.
- Usar timezone del navegador para calcular horarios del calendario.
- Mezclar solicitudes pendientes con citas confirmadas en la misma lista sin distinguir estados.
- Confiar en IDs enviados desde frontend para propiedad.

## 16. Orden recomendado para desarrollar rapido

1. Crear modelos y estados.
2. Crear calendario del dueño.
3. Crear edicion de disponibilidad semanal.
4. Crear calculo de slots libres.
5. Crear formulario publico de solicitud.
6. Crear listado de solicitudes pendientes.
7. Crear aceptar/rechazar.
8. Crear vista de citas confirmadas.
9. Crear cancelar cita.
10. Agregar bloqueos de doble click y estados de carga.
11. Probar casos borde de concurrencia.
12. Pulir mensajes y UX.

## 17. Version minima viable

Si se necesita implementar en pocas horas, hacer solo esto:

- Un calendario por dueño.
- Disponibilidad semanal por hora.
- Portal publico con slots y formulario de contacto.
- Crear solicitudes `REQUESTED`.
- Panel privado con pendientes.
- Aceptar cambia a `CONFIRMED` con revalidacion de conflicto.
- Rechazar cambia a `REJECTED`.
- Cancelar cambia a `CANCELLED`.
- Slots libres descuentan solo `CONFIRMED` y `SCHEDULED`.

Todo lo demas puede esperar.

## 18. Resumen para el agente implementador

Implementa el sistema como una maquina de estados simple:

- El publico nunca crea citas confirmadas directamente.
- El publico crea solicitudes pendientes con datos de contacto.
- El dueño decide aceptar o rechazar.
- Solo al aceptar se bloquea el calendario.
- Antes de crear o aceptar, el backend revalida que el horario siga libre.
- La UI debe impedir doble click y mostrar hora en cada solicitud.

Si se respetan esas reglas, el sistema sera simple, rapido de construir y dificil de romper.
