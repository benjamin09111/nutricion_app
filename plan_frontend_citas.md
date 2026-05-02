```md
# Frontend Integration Guide (Multi-tenant Appointments Service)
**Audience:** Agentes/IA que construirán frontends (Dance / Nutri / Freelance / etc.)  
**Goal:** Consumir correctamente el **servicio de gestión de citas** (calendars, availability, slots, requests, accept/reject, booking links) desde cualquier app frontend.

---

## 1) Requisitos obligatorios (antes de tocar UI)

### 1.1 Variables de entorno del frontend
Definir (nombres sugeridos; el agente puede adaptarlos al framework):
- `APPOINTMENTS_API_BASE_URL`  
  Ej: `https://api.tudominio.com` o `http://localhost:3000`
- `TENANT_ID` o `TENANT_SLUG`  
  Ej: `nutri-app`, `dance-app`
- `AUTH_MODE` (si aplica): `jwt` o `public`
- `JWT_STORAGE_STRATEGY`: `memory` recomendado (o `httpOnly cookie` si existe)
- `TIMEZONE_DEFAULT` (si el frontend necesita fallback)  
  Ej: `America/Santiago`

### 1.2 Identificación multi-tenant (MANDATORIO)
**Cada request al backend debe incluir el tenant**, usando header o subdominio.

**Header recomendado**
- `X-Tenant-ID: <tenant-slug>`
  - Ej: `X-Tenant-ID: nutri-app`

> Si tu backend usa otro header o estrategia (subdominio), el agente debe leer la config real del backend. No asumir.

### 1.3 Autenticación (2 modos)
El frontend debe soportar ambos, porque hay pantallas públicas y privadas:

#### (A) Modo Privado (host/staff/admin)
- Requiere JWT (o el mecanismo del backend)
- Acceso a: crear calendario, editar reglas, ver requests, aceptar/rechazar, crear booking links, ver week/day view completo.

#### (B) Modo Público (guest)
- No requiere login (si tu backend lo permite)
- Acceso a: ver slots públicos, crear requests en calendario público o vía booking link.

---

## 2) Conceptos de UI (qué pantallas mínimas necesita cualquier app)

### 2.1 Pantallas para Host (dueño del horario)
1. **Dashboard Calendars**
   - Listar mis calendarios (`GET /calendars/me`)
   - Entrar a 1 calendario

2. **Calendar View (Day/Week) estilo Google**
   - Cargar datos por día/semana
   - Ver citas confirmadas, solicitudes pendientes, bloques
   - Acciones rápidas: aceptar/rechazar/cancelar

3. **Availability Settings**
   - Editar reglas semanales (horario)
   - Crear bloqueos (ocupado/libre override)
   - Config: timezone, duration default, buffers, min notice, max days ahead

4. **Requests Inbox**
   - Lista de solicitudes PENDING/REQUESTED
   - Detalle de solicitud
   - Botones: Accept / Reject

5. **Booking Links**
   - Crear link fijo o flexible
   - Copiar link y compartir
   - Ver estado (uses restantes / expiración)

### 2.2 Pantallas para Guest (cliente final)
1. **Public Booking Page**
   - Seleccionar día
   - Ver slots disponibles (`GET /calendars/:id/slots`)
   - Crear solicitud (`POST /calendars/:id/requests`)

2. **Booking Link Page**
   - Abrir link
   - Ver info del link (`GET /booking-links/:token`)
   - Crear request vía link (`POST /booking-links/:token/requests`)

3. **Request Status**
   - Ver que quedó enviada / aceptada / rechazada
   - (Opcional) permitir cancelar

---

## 3) Flujos funcionales que el frontend debe implementar

### 3.1 Flujo: Host define horario
1. Host abre Settings del Calendar
2. Guarda reglas semanales:
   - `PUT /calendars/:calendarId/availability/rules`
3. Crea bloqueos puntuales cuando lo necesite:
   - `POST /calendars/:calendarId/availability/blocks`

**Resultado esperado**
- `/slots` refleja inmediatamente la disponibilidad.

### 3.2 Flujo: Guest reserva (solicitud)
1. Guest consulta slots:
   - `GET /calendars/:calendarId/slots?from=...&to=...&durationMin=...`
2. Guest elige slot y envía request:
   - `POST /calendars/:calendarId/requests`
3. UI muestra “solicitud enviada” con status.

### 3.3 Flujo: Host acepta / rechaza
1. Host lista requests pendientes:
   - `GET /calendars/:calendarId/requests?status=REQUESTED`
2. Host acepta:
   - `POST /requests/:requestId/accept`
3. (Backend) crea Appointment y sincroniza Google Calendar async
4. UI:
   - remueve request de inbox
   - muestra cita en week/day view
   - slots pasan a ocupado

> Importante: manejar `409 Conflict` (overbooking). UI debe mostrar error “Slot ya no está disponible”.

### 3.4 Flujo: Booking link (host → guest)
1. Host crea link:
   - `POST /calendars/:calendarId/booking-links`
2. Comparte URL resultante
3. Guest abre link:
   - `GET /booking-links/:token`
4. Guest crea request:
   - `POST /booking-links/:token/requests`

---

## 4) Contrato de fechas/horas (CRÍTICO)

### 4.1 Formato
- En requests/responses usar ISO-8601 en UTC cuando aplique:
  - `2026-05-01T14:00:00.000Z`

### 4.2 Timezone de visualización
- El frontend debe renderizar según:
  1. `calendar.timeZone` (si el backend lo expone en el detalle del calendario)
  2. fallback: timezone del usuario del navegador

### 4.3 Rango day/week recomendado
- Day: `from = startOfDay`, `to = endOfDay` (en timezone del calendario)
- Week: `from = weekStart`, `to = weekEnd`
- Para slots, pedir rangos razonables (ej 7 días, 14 días) para performance.

---

## 5) Endpoints (resumen para consumo en frontend)

> Nota: usar los endpoints reales ya implementados; esto es el set esperado.

### Calendars (privado)
- `GET /calendars/me`
- `GET /calendars/:calendarId`
- `POST /calendars`
- `PATCH /calendars/:calendarId`

### Availability (privado)
- `PUT /calendars/:calendarId/availability/rules`
- `GET /calendars/:calendarId/availability/rules`
- `POST /calendars/:calendarId/availability/blocks`
- `GET /calendars/:calendarId/availability/blocks?from&to`
- `DELETE /calendars/:calendarId/availability/blocks/:blockId`

### Slots (público o privado según config)
- `GET /calendars/:calendarId/slots?from&to&durationMin`

### Requests
- `POST /calendars/:calendarId/requests` (público o privado)
- `GET /calendars/:calendarId/requests?status=...` (privado host)
- `GET /requests/:requestId` (según permisos)
- `POST /requests/:requestId/accept` (host)
- `POST /requests/:requestId/reject` (host)
- `POST /requests/:requestId/cancel` (guest/host)

### Booking Links
- `POST /calendars/:calendarId/booking-links` (host)
- `GET /booking-links/:token` (público)
- `POST /booking-links/:token/requests` (público)

### Views tipo Google (si están habilitadas)
- `GET /calendars/:calendarId/view/day?date=...`
- `GET /calendars/:calendarId/view/week?weekStart=...`

---

## 6) Requisitos de permisos (qué debe respetar el frontend)

### 6.1 Host/Staff
- Puede:
  - editar availability
  - crear blocks
  - ver requests del calendario
  - aceptar/rechazar
  - crear booking links
  - ver day/week view completo

### 6.2 Guest
- Puede:
  - ver slots (si calendar es público o si entra vía link)
  - crear request
  - ver estado (si el backend lo permite)
  - cancelar su request (si el backend lo permite)

---

## 7) Manejo de errores (UI/UX mínimo)

El frontend debe manejar explícitamente:

- `401 Unauthorized` → volver a login
- `403 Forbidden` → mostrar “no tienes permisos”
- `404 Not Found` → calendario/link no existe
- `409 Conflict` → slot ocupado / overbooking (mostrar “ya no disponible”)
- `410 Gone` (recomendado para links expirados/agotados) → mostrar “link expiró”
- `422 Unprocessable Entity` → errores de validación (mostrar mensajes)
- `5xx` → fallback genérico + retry

---

## 8) HTTP client wrapper (obligatorio para consistencia)

Implementar un wrapper único de requests (fetch/axios) que:
1. Inyecte siempre:
   - `X-Tenant-ID`
   - `Authorization: Bearer <token>` si existe
2. Centralice parseo de errores y retries (solo idempotentes)
3. Loguee requestId/correlationId si el backend lo entrega

---

## 9) Checklist final (para declarar “frontend conectado correctamente”)

### Público (Guest)
- [ ] Puedo ver slots disponibles de un calendar público
- [ ] Puedo crear una solicitud de cita
- [ ] Si el slot se ocupa, recibo 409 y la UI lo refleja

### Privado (Host)
- [ ] Puedo ver mis calendarios
- [ ] Puedo definir reglas semanales y crear bloqueos
- [ ] Puedo ver requests pendientes
- [ ] Puedo aceptar/rechazar
- [ ] Puedo crear booking links y que funcionen

---

## 10) Entrega esperada por cada app frontend
Cada agente que construya una app debe entregar:

1. **Archivo `.env.example`** con `APPOINTMENTS_API_BASE_URL` y `TENANT_ID`
2. **HTTP client wrapper** con inyección de tenant + auth
3. **Pantallas mínimas** Host + Guest (aunque sea un MVP simple)
4. **Smoke tests manuales** (pasos de prueba escritos) para:
   - slots
   - request
   - accept
   - booking link
```