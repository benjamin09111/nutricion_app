# Guía de Integración: Servicio de Citas (Backend)

Este documento es una guía técnica para que cualquier agente o desarrollador pueda integrar el frontend con este servicio de citas. El servicio es un **Monolito Modular Multi-tenant** construido con NestJS y Prisma.

---

## 1. Configuración Base

*   **URL Base**: `http://localhost:3030`
*   **Headers Obligatorios**:
    *   `X-Tenant-ID`: El slug del tenant (ej: `nutri-app`). Sin este header, todas las peticiones devolverán `401 Unauthorized`.
    *   `Authorization`: `Bearer <JWT_TOKEN>` (Para todos los endpoints privados).
    *   `Content-Type`: `application/json`

---

## 2. Flujo de Autenticación

### Login / Registro
*   **Endpoint**: `POST /auth/login` o `POST /auth/register`
*   **Nota**: Requiere el header `X-Tenant-ID`.
*   **Resultado**: Devuelve un `token` JWT que contiene el `userId`, `role` y `tenantId`.

---

## 3. Dashboard del Nutricionista (Privado)

Para todas estas peticiones, el frontend **DEBE** estar logueado.

### A. Obtener mi Calendario
Antes de mostrar nada, el nutri necesita saber qué calendario le pertenece.
*   **Endpoint**: `GET /calendars/me`
*   **Uso**: Si devuelve un array vacío `[]`, significa que el nutri debe crear uno. Si hay datos, guarda el `id` del calendario para las siguientes llamadas.

### B. Vista de Calendario (Tipo Google Calendar)
*   **Endpoint**: `GET /calendars/:calendarId/view/week?weekStart=2026-05-01`
*   **Respuesta**: Devuelve una lista de `events` que incluye:
    *   `appointments` (Citas confirmadas)
    *   `requests` (Peticiones pendientes, ideal para mostrar en color distinto)
    *   `blocks` (Horarios bloqueados manualmente)

### C. Configurar Horarios de Trabajo
*   **Endpoint**: `PUT /calendars/:calendarId/availability/rules`
*   **Body**:
    ```json
    {
      "rules": [
        { "dayOfWeek": 1, "startTime": "09:00", "endTime": "14:00" },
        { "dayOfWeek": 1, "startTime": "16:00", "endTime": "20:00" }
      ]
    }
    ```

### D. Gestión de Citas y Solicitudes
*   **Ver solicitudes pendientes**: `GET /calendars/:calendarId/requests?status=REQUESTED`
*   **Aceptar solicitud**: `POST /requests/:requestId/accept` (Esto crea la cita automáticamente).
*   **Rechazar solicitud**: `POST /requests/:requestId/reject`
*   **Crear cita manual**: `POST /appointments`

---

## 4. Reserva Pública (Paciente)

Estos endpoints se usan desde la página que el nutri comparte con sus pacientes.

### A. Crear Link de Reserva
El nutri genera un link para compartir.
*   **Endpoint**: `POST /calendars/:calendarId/booking-links`
*   **Resultado**: Devuelve un `token` único. La URL pública será algo como `.../portal/citas/:token`.

### B. Ver disponibilidad (Página del Paciente)
El paciente entra al link y ve los huecos libres.
*   **Obtener info del link**: `GET /booking-links/:token` (Devuelve el nombre del nutri, calendario, etc).
*   **Ver slots libres**: `GET /calendars/:calendarId/slots?from=...&to=...&durationMin=30`
    *   *Nota*: El backend calcula automáticamente los huecos disponibles restando las citas y bloqueos de las reglas de trabajo.

### C. Enviar solicitud de cita
*   **Endpoint**: `POST /booking-links/:token/requests`
*   **Body**: Datos del paciente (`name`, `email`, `start`, `end`, `notes`).

---

## 5. Notas de Desarrollo (Estado Actual)

> [!IMPORTANT]
> **Redis Desactivado**: Actualmente, el servicio de colas (Redis/BullMQ) está comentado en el código para permitir el desarrollo local sin infraestructura pesada. 
> *   Las notificaciones **se guardan en la DB** pero **no se envían correos** reales ni se sincroniza con Google Calendar de forma asíncrona por ahora.

> [!TIP]
> **Logs de Debug**: He activado logs detallados en la terminal del backend. Si una petición falla, revisa la terminal para ver el "JWT Payload" o el "Tenant ID" detectado.

---

## 6. Errores Comunes
*   **401 "Tenant no encontrado"**: Verifica que el header `X-Tenant-ID` coincida con un slug en la base de datos (ej: `nutri-app`).
*   **401 "Token inválido"**: Verifica que el `JWT_SECRET` en el `.env` del backend coincida con el que generó el token.
*   **CORS Error**: El backend ya está configurado para permitir `X-Tenant-ID`, pero asegúrate de que el frontend incluya `credentials: 'include'` si usas cookies o simplemente los headers mencionados.
