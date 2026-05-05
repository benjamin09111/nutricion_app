# Changelog - Refinamiento de Comunicación en Portal y Dashboard

## Resumen
En esta sesión se reestructuró el sistema de comunicación entre el nutricionista y el paciente, simplificando el registro diario y añadiendo un canal de mensajería unidireccional directo al portal.

## Cambios Realizados

### Backend
- **PatientPortalsService**:
    - Simplificación de `createTrackingEntry`: Ahora solo recibe un `body` de texto libre, eliminando las categorías estructuradas.
    - Implementación de `createPortalMessage`: Nuevo método para enviar mensajes asíncronos que no disparan correos.
    - Actualización de `buildOverview`: Se añadió la categoría `MESSAGE` al resumen del portal.
- **PatientPortalsController**:
    - Exposición del endpoint `POST /patients/:patientId/messages`.

### Dashboard del Nutricionista (`PatientDetailClient.tsx`)
- **Navegación**:
    - Se renombró la pestaña "Comunicados" a "Notificaciones Correo".
    - Se añadió la nueva pestaña "Mensajes al Paciente".
    - Se simplificó la etiqueta de "Diario" a "Diario de Paciente".
- **Interfaz de Mensajería**:
    - Nueva vista de feed para mensajes directos con campo de texto para publicación inmediata.
- **Interfaz de Diario**:
    - Se eliminaron los filtros y dots de colores por categorías (Alimentación/Suplementos/Deporte).

### Portal del Paciente (`PortalClient.tsx`)
- **Navegación Sidebar**:
    - Se añadió el acceso a "Mensajes de tu Nutri".
    - Se renombró "Información de tu nutri" a "Notificaciones Correo".
    - Se actualizaron iconos y etiquetas para mayor claridad.
- **Vistas de Contenido**:
    - Implementación de la vista de feed de mensajes asíncronos del nutricionista.
    - Actualización de la vista de notificaciones oficiales.
    - Simplificación del input de diario para reflejar el enfoque de texto libre.

## Decisiones Técnicas
- **Desacoplamiento**: Se separó la comunicación de alta prioridad (Email) de la comunicación pasiva (Feed del Portal) para evitar saturar al paciente con correos innecesarios.
- **Reducción de Fricción**: El diario ahora es una "libreta de notas" libre, lo que facilita el registro sin obligar al paciente a categorizar cada entrada.

## Próximos Pasos
- Verificar el envío de correos en la sección "Notificaciones Correo" para asegurar que la integración con el servicio de mail sigue operativa tras el renombrado.
- Monitorear el uso del nuevo feed de mensajes para evaluar si se requiere respuesta del paciente en el futuro (actualmente es unidireccional).
