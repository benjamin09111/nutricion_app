# Plan: fix-ai-recipes-dishes-generation

**Date:** 2026-05-06
**Author:** agent + developer
**Mode:** ADAPTIVE

## Goal
Arreglar la generación con IA de platos en `/dashboard/rapido/recetas` y `/dashboard/recetas` sin tocar el flujo que ya funciona en `/dashboard/rapido`.

## Scope
Reparar prompts, payloads y estrategia de llamadas para generación de platos usando el endpoint actual de recetas rápidas.

### In Scope
- `backend/src/common/services/ai.service.ts`
- `backend/src/modules/recipes/recipes.service.ts`
- `frontend/src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx`
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx`
- artefactos `.collab` de esta sesión

### Out of Scope
- Cambios en `/dashboard/rapido`
- Nuevos proveedores de IA
- Migraciones o cambios de base de datos

## Research
- **KIs read:** reglas `.agent`, `.collab`, arquitectura y sesión previa `fix-ai-quota-issue-recipes`
- **Skills loaded:** ninguno disponible con el nombre obligatorio del repo
- **Files to modify:** los cuatro archivos anteriores y `.collab/active.md`

## Implementation Plan
1. Dejar activa la sesión `.collab` y registrar el plan.
2. Simplificar el prompt backend de platos y recortar contexto excesivo.
3. Mejorar el error del servicio de IA cuando el proveedor no entregue `content`.
4. Hacer batching de generación en ambas pantallas de recetas para evitar respuestas enormes o vacías.
5. Verificar con build/lint focalizado y documentar walkthrough/changelog.

## Verification Plan
- Lint: `npm run lint` en `frontend/`
- Typecheck: `npm run build` en `backend/`
- Tests: no se planean tests automáticos nuevos para este fix
- Manual checks:
  - `/dashboard/rapido` sigue igual
  - `/dashboard/rapido/recetas` vuelve a generar platos
  - `/dashboard/recetas` vuelve a generar y asignar platos

## Risks & Dependencies
- DeepSeek puede seguir fallando si el contexto enviado es demasiado largo.
- El worktree ya tiene cambios previos en archivos de recetas; hay que trabajar encima de ellos sin revertir.
