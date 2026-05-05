# Plan: Implement Portal Diario (Facebook/Tweet Style)

## Objetivo
Implementar la funcionalidad de "Diario" en el Portal del Paciente, permitiendo un registro simple y directo mediante un único campo de texto, con un feed de entradas estilo tweets.

## Alcance
- **Interfaz**: Sustituir el marcador de posición del Diario por un input real (`textarea`) y un feed de mensajes.
- **Interacción**: Publicar entradas directamente sin modales ni pasos extra.
- **Visual**: Entradas mostradas cronológicamente con su fecha y hora automática.
- **Backend**: Utilizar el endpoint `POST /patient-portals/me/journal` para guardar el registro.

## Pasos de Implementación

### Fase 1: Frontend (PortalClient.tsx)
1. **Estado del Input**: Añadir un estado local `entryText` para controlar el contenido de la libreta.
2. **Componente de Entrada**:
   - Crear un `textarea` con el placeholder solicitado.
   - Botón "Publicar para mi nutricionista" con estado de carga.
3. **Lógica de Envío**:
   - Función `handleSubmitEntry` para validar y enviar el texto al backend.
   - Actualizar el estado local `portalData` tras un envío exitoso para mostrar la nueva entrada de inmediato.
4. **Feed de Diario**:
   - Renderizar el listado de `tracking` (del `portalData`) filtrando y mapeando los datos para que parezcan tweets.
   - Formatear la fecha/hora de forma legible.

### Fase 2: Backend (Opcional - Verificación)
1. Verificar si el DTO `CreatePatientPortalEntryDto` requiere ajustes para soportar mejor un texto único (inicialmente se usará `alimentacion` como contenedor principal del texto).

## Plan de Verificación
- **Funcional**: Escribir un mensaje y verificar que aparece en el historial tras publicar.
- **Visual**: Confirmar que el diseño se siente ligero, limpio y tipo "feed".
- **UX**: Validar que no hay popups y que el flujo es instantáneo.
