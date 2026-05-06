# Changelog: Refactor Portal UX

## [05-05-2026] - Portal del Paciente (Rediseño Estándar)

### Añadido
- Sidebar de navegación interno para el portal del paciente.
- Secciones estructuradas: Biblioteca, Mis Recursos y Portada e Introducción.
- Nuevos botones de acción rápida con micro-interacciones hover.

### Cambiado
- **Refactor Visual**: Aplicado el estándar "Pacientes" en todo el `PortalClient.tsx`.
- **Tipografía**: Migración de `font-black` a `font-semibold` y pesos más ligeros para mejorar la legibilidad.
- **Jerarquía**: Reordenamiento de bloques de contenido para priorizar Biblioteca y Mis Recursos.
- **Paleta**: Reducción de contrastes agresivos (reemplazado Emerald dominante por Indigo sutil y fondos Ivory/Blancos).

### Corregido
- Alineación de filtros en la Biblioteca de Recursos (en `ResourcesClient.tsx` de una tarea anterior pero confirmada en esta sesión).
- Mejora en el uso del espacio para evitar scroll innecesario.

### Próximos Pasos
- Implementar la funcionalidad real de los botones de "Registro" y "Consulta" (actualmente visuales).
- Agregar más interactividad al sidebar del portal (estados active/focus).
