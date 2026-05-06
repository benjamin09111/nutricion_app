# Plan: Fix Portal Feedback

## Objetivo
Refinar las secciones del Portal del Paciente y el Dashboard del Nutricionista basándose en el feedback del usuario.

## Tareas

### 1. Diario (Patient Portal)
- Simplificar `createTrackingEntry` en el backend para que sea solo texto libre (sin categorías o estructuras forzadas).
- Asegurar que en el frontend se renderice como un historial simple de escritos.

### 2. Notificaciones por Correo (Rename)
- Renombrar la sección de "Comunicados" a "Notificaciones por correo" tanto en el dashboard del nutri como en el portal.
- Clarificar que estos envíos disparan correos electrónicos.

### 3. Mensajes al Paciente (New Section)
- Crear una nueva sección "Mensajes de tu Nutri" en el portal (Nutri -> Paciente).
- Implementar la funcionalidad en el dashboard del nutri para enviar estos mensajes (sin disparar correo necesariamente, solo lectura en el portal).
- "Es como el diario pero al revés".

### 4. Reestructuración de Tabs
- **Portal Paciente**:
  1. **Diario de Seguimiento** (Paciente escribe)
  2. **Mensajes de tu Nutri** (Nutri escribe - Nueva)
  3. **Dudas y Consultas** (Q&A)
  4. **Planes y Guías** (Deliverables)
  5. **Notificaciones por Correo** (Rename de Info/Comunicados)
- **Dashboard Nutri (Acompañamiento)**:
  - Sincronizar los nombres de las pestañas.
  - Añadir la pestaña "Mensajes Enviados".

## Pasos de Implementación
1. **Backend**: 
   - Simplificar `createTrackingEntry`.
   - Añadir método `createPortalMessage` (Nutri -> Paciente).
2. **Frontend (Nutri Dashboard)**:
   - Refactorizar pestañas de Acompañamiento.
   - Añadir el envío de Mensajes.
3. **Frontend (Patient Portal)**:
   - Refactorizar sidebar y secciones de contenido.
4. **Verificación**: Comprobar flujos de comunicación.
