# Plan: Implement Portal Notifications (Avisos del Nutri)

## Objetivo
Transformar la pestaña de "Información de tu nutri" en un centro de avisos y notificaciones donde el nutricionista pueda enviar comunicados al paciente. Implementar un indicador visual (punto de notificación) en la barra lateral para alertar sobre nuevos mensajes.

## Alcance
- **Interfaz de Avisos**: Listado cronológico de mensajes enviados por el nutricionista.
- **Visual**: Estilo de "Comunicado Oficial" con título, cuerpo del mensaje y fecha.
- **Indicador Sidebar**: Punto verde de notificación al lado del texto "Información de tu nutri" cuando existan notificaciones.
- **Interacción**: El paciente solo puede leer, no responder en esta sección (las respuestas van por el canal de consultas).

## Pasos de Implementación

### Fase 1: Frontend (PortalClient.tsx)
1. **Indicador de Notificación**:
    - Añadir lógica en la sidebar para mostrar un círculo verde (`bg-emerald-500`) si `portalData.notifications.length > 0`.
    - Opcional: Persistir un "last_read_notifications" en localStorage para ocultar el punto una vez que el usuario visite la pestaña.
2. **Pestaña de Información (Notificaciones)**:
    - Reemplazar los datos estáticos del expediente por el feed de `portalData.notifications`.
    - Cada notificación mostrará:
        - Título (`payload.notificationTitle`).
        - Cuerpo del mensaje (`body`).
        - Fecha de envío.
        - Icono de "Oficial" o "Aviso".
3. **Refactor de Estilos**:
    - Usar el estándar visual de la aplicación (bordes redondeados, tipografía ligera).
    - Mantener la información del nutri (nombre/avatar) como cabecera de la sección.

## Plan de Verificación
- **Funcional**: Confirmar que las notificaciones creadas en el backend aparecen en la pestaña.
- **Visual**: Verificar que el punto de notificación en la sidebar es visible y no rompe el layout.
- **UX**: Asegurar que la lectura sea clara y el diseño se sienta premium.
