# Plan: Implement Portal Questions (Q&A Style)

## Objetivo
Implementar la pestaña de "Preguntas a tu nutri" en el Portal del Paciente, reutilizando el estilo visual del Diario pero añadiendo soporte para respuestas del nutricionista mostradas como comentarios de red social.

## Alcance
- **Interfaz**: Reutilizar el componente de publicación del Diario pero dirigido a consultas.
- **Visual**: 
    - Preguntas del paciente: Estilo similar a los tweets del diario.
    - Respuestas del nutri: Mostradas debajo de la pregunta, indentadas y con el avatar del profesional.
- **Interacción**: Publicación directa de preguntas y visualización de hilos de conversación.
- **Backend**: Utilizar `POST /patient-portals/me/questions` para enviar las consultas.

## Pasos de Implementación

### Fase 1: Frontend (PortalClient.tsx)
1. **Estados**: Añadir `questionText` e `isSubmittingQuestion`.
2. **Lógica de Envío**: Función `handleSubmitQuestion` similar a la del Diario.
3. **Pestaña de Preguntas**:
    - Reutilizar el diseño del `textarea` y el feed.
    - Cambiar placeholder y etiquetas para reflejar que es una consulta al profesional.
4. **Renderizado de Hilos**:
    - Mapear `portalData.questions`.
    - Para cada pregunta, renderizar sus `replies` como sub-comentarios.
    - Usar `portalData.patient.nutritionist` para obtener el nombre/avatar del nutri en las respuestas.

## Plan de Verificación
- **Funcional**: Enviar una pregunta y verificar que aparece en el feed.
- **Visual**: Confirmar que las respuestas (si existen) se ven como comentarios anidados.
- **UX**: Mantener la agilidad y el modo "feed" sin popups.
