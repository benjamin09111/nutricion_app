# Plan: quick-recipes-remove-recipe-metadata-payload

**Date:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## Goal
Corregir el guardado posterior al PDF en recetas rápidas eliminando el campo `metadata` inválido del payload hacia `/recipes`.

## Scope
- `frontend/src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx`
- artefactos `.collab` de esta sesión

## Verification Plan
- `npx eslint src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx --quiet`
