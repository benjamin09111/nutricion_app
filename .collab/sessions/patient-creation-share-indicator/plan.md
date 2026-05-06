# Sesión Activa: Indicador de Creaciones Compartidas

**ID**: `patient-creation-share-indicator`
**Modo**: `TURBO`
**Estado**: `Phase 1: Research`
**Objetivo**: corregir el `ReferenceError` `Send is not defined` en el portal del paciente y hacer que las creaciones compartidas se vean verdes/parpadeantes, además de permitir descompartirlas con el mismo botón.

## Archivos Involucrados
- `frontend/src/app/portal/[token]/PortalClient.tsx`
- `frontend/src/app/dashboard/creaciones/CreationsClient.tsx`
- `frontend/src/app/dashboard/pacientes/[id]/PatientDetailClient.tsx`
- `backend/src/modules/creations/creations.service.ts`

## Plan de Cambio
- Corregir el import faltante de `Send` en el portal del paciente para eliminar el error runtime.
- Hacer que el endpoint de compartir en `creations.service.ts` funcione como toggle: si ya estaba compartida, la quita; si no, la agrega.
- Pasar al cliente de creaciones la lista de IDs compartidos para que el ícono se pinte verde y parpadee cuando corresponda.
- Refrescar el estado del detalle del paciente para que la pestaña de acompañamiento muestre inmediatamente lo compartido o descompartido.

## Verificación
- Confirmar que el portal del paciente carga sin `ReferenceError`.
- Verificar que una creación compartida muestre el ícono en verde con animación.
- Verificar que volver a pulsar el botón la descomparta y quite el estado visual.
