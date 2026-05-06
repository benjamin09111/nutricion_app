# Plan: Refactor Citas Frontend

## Goal
Desacoplar el "God Component" `AppointmentsClient.tsx` (1900+ líneas) en una arquitectura modular usando SWR/React Query (ya instalado @tanstack/react-query) para el manejo de datos, separando la lógica pura de la UI y extrayendo los componentes de pestañas y modales. Esto resolverá problemas de rendimiento, mantenibilidad y re-renderizados innecesarios.

## Scope
- Frontend: `src/app/dashboard/citas/`
- Adaptadores: `src/lib/appointments-adapter.ts`
- Data Fetching: `src/lib/useAppointmentsData.ts` o equivalente.

## Pasos

### Fase 1: Data Fetching y Adaptadores
1. Mover funciones de normalización y parseo (`normalizeAvailabilityRules`, `createRulesFromWorkHoursGrid`, etc.) a `src/lib/appointments-adapter.ts`.
2. Crear un custom hook en `src/lib/hooks/useAppointments.ts` utilizando `@tanstack/react-query` para manejar las peticiones (`/calendars/me`, `/availability/rules`, `/view/week`, `/requests`, etc.).
3. Reemplazar el `loadData` gigante en `AppointmentsClient.tsx` con el uso del custom hook.

### Fase 2: Modularización de Pestañas
1. Crear `components/AppointmentsCalendarTab.tsx` para la vista "Próximas" y "Pasadas".
2. Crear `components/AppointmentsRequestsTab.tsx` para aceptar/rechazar.
3. Crear `components/AppointmentsScheduleTab.tsx` para gestionar horarios laborales.
4. Crear `components/AppointmentsGoogleTab.tsx` para la conexión a Google Calendar.

### Fase 3: Modales
1. Extraer `<CreateAppointmentModal />`.
2. Extraer `<ShareScheduleModal />`.
3. Mantener `AppointmentsClient.tsx` solo como layout maestro y gestor de tabs.

## Verification
- Ejecutar `tsc --noEmit`
- Verificar que las funcionalidades mencionadas (pedir, mandar, ver citas, actualizar horario, conectar a google) funcionen con el nuevo flujo sin perder el estado o mostrar errores.
