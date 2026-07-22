# Convenciones de API y Código

## 1. Separación de Responsabilidades (Frontend)
- **UI de Renderizado**: Los archivos en `src/app` o `src/features/components` deben centrarse únicamente en la vista/renderizado.
- **Estado y Lógica de Negocio**: Estados complejos de React, llamadas API y handlers de eventos deben extraerse a hooks de React personalizados (ej. `useRecipesState.ts`).
- **Cálculos y Transformaciones**: Las funciones puras, generadores de PDF o lógica matemática deben ubicarse en archivos auxiliares en `src/lib/` o carpetas de utilidad correspondientes.
- **Límites de Tamaño**: Nunca crear ni expandir componentes de UI en archivos monolíticos gigantes (máximo 400 líneas). Extraer subcomponentes funcionales.

## 2. API y Backend (NestJS)
- **Modularidad**: Lógica de negocio encapsulada en Services. Validación en DTOs. Control de rutas y Swagger en Controllers.
- **Seguridad**: Todas las rutas sensibles deben estar protegidas mediante guards (`@UseGuards`).
- **Respuestas**: Siempre usar DTOs de entrada/salida tipados para asegurar contratos claros entre el frontend y el backend.
