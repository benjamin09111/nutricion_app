# Plan de Acción: Corrección de Duplicados al Editar Creaciones

## Problema Identificado
Al editar una creación existente (Dieta, Carrito, etc.) y guardarla, el sistema crea una **nueva entrada** en la base de datos en lugar de actualizar la original. Esto ocurre porque:
1. La función centralizada `saveCreation` en `workflow.ts` utiliza exclusivamente el método `POST`.
2. Los componentes del dashboard (como `DietClient`) no mantienen el rastro del ID de la creación que están editando para pasárselo a la función de guardado.

## Fases de Implementación

### Fase 1: Actualización de la Capa de Datos (`workflow.ts`)
- Modificar la interfaz del payload de `saveCreation` para incluir un campo opcional `id`.
- Implementar la lógica para decidir entre `POST` (crear) y `PATCH` (actualizar) basándose en la presencia de dicho ID.

### Fase 2: Actualización del Módulo de Dietas (`DietClient.tsx`)
- Añadir un nuevo estado `editingCreationId` para rastrear la creación activa.
- Actualizar `handleImportCreation` para capturar el ID cuando se carga una dieta existente.
- Asegurar que `resetDietState` limpie este ID al iniciar una nueva dieta.
- Modificar los handlers de guardado para que envíen el ID a `saveCreation`.

### Fase 3: Extensión a Otros Módulos
- Aplicar la misma lógica en `CartClient.tsx`, `RecipesClient.tsx` y los entregables rápidos para garantizar un comportamiento consistente en toda la plataforma.

## Verificación
1. Entrar en "Mis Creaciones".
2. Editar una dieta existente.
3. Cambiar el nombre o el contenido y guardar.
4. Verificar que no se cree una nueva fila en la tabla, sino que se actualice la existente.
