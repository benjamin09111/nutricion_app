# Changelog: recipes-remove-quick-index

**Completed:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## What Was Done
Se eliminó el índice rápido lateral de `/dashboard/recetas`.

## Key Decisions

- Se quitó el bloque visual del índice y también la lógica que lo alimentaba para no dejar código muerto.
- No se tocaron las secciones reales del módulo; solo se removió la navegación lateral.

## Files Changed
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx`
