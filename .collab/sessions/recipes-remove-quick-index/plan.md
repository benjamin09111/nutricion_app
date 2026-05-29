# Plan: recipes-remove-quick-index

**Date:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## Goal
Quitar el índice rápido lateral de `/dashboard/recetas`.

## Scope
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx`
- artefactos `.collab` de esta sesión

## Implementation Plan
1. Eliminar el `SectionProgressNav` del render.
2. Limpiar tipos, estado y lógica usados solo por ese índice.
3. Verificar que no queden referencias colgando.

## Verification Plan
- `npx eslint src/app/dashboard/recetas/RecipesClient.tsx --quiet`
