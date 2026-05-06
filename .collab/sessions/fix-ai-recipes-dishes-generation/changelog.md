# Changelog: fix-ai-recipes-dishes-generation

**Completed:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## What Was Done
Se estabilizó la generación de platos con IA en recetas rápidas y recetas normales reduciendo el tamaño de cada llamada y endureciendo el manejo backend cuando DeepSeek devuelve respuestas vacías o incompletas.

## Key Decisions

- Mantener `/dashboard/rapido` intacto y reutilizar el endpoint actual de `quick-ai-fill`.
- Dividir las solicitudes de platos en lotes pequeños para evitar respuestas vacías por exceso de contexto o salida demasiado grande.
- Aceptar un `recommendedPortion` por defecto cuando la IA omite ese campo, en lugar de rechazar todo el lote.

## Files Changed
- `backend/src/common/services/ai.service.ts` — mensaje de error más útil para respuestas sin `content`.
- `backend/src/modules/recipes/recipes.service.ts` — prompt más compacto y contexto recortado.
- `frontend/src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx` — batching para generación de platos rápidos.
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx` — batching para generación y asignación de platos.
- `.collab/active.md` — cierre de sesión.

## What's Next

- Probar manualmente los tres flujos: `/dashboard/rapido`, `/dashboard/rapido/recetas` y `/dashboard/recetas`.
- Si DeepSeek sigue devolviendo vacío en casos extremos, bajar aún más el tamaño de lote o separar por sección fija.

## Roadmap Update

- No cambia el estado del roadmap; es un fix de estabilidad sobre funcionalidad existente.
