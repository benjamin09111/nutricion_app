# Plan: quick-recipes-import-only-patient

**Date:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## Goal
Quitar la creación rápida de paciente en `/dashboard/rapido/recetas` y permitir que la IA genere platos aunque no haya un paciente vinculado.

## Scope
- `frontend/src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx`
- artefactos `.collab` de esta sesión

## In Scope
- Remover el modal y handlers de "crear paciente general"
- Dejar el selector de paciente solo para importar/elegir pacientes existentes
- Permitir `quick-ai-fill` sin paciente, enviando `patient: null`
- Ajustar copys y estados visuales para que no digan que la IA requiere paciente

## Out of Scope
- Cambios en `/dashboard/rapido`
- Cambios en `/dashboard/recetas`
- Cambios en backend o base de datos

## Implementation Plan
1. Limpiar imports, tipos, estados y handlers del alta rápida de paciente.
2. Quitar el bloqueo de IA cuando `selectedPatient` es `null`.
3. Mantener el PDF como flujo con paciente obligatorio.
4. Actualizar textos del flujo para reflejar que importar paciente es opcional para IA y obligatorio para PDF.
5. Verificar con lint focalizado del componente.

## Verification Plan
- `npx eslint src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx --quiet`

## Assumptions
- Se asume modo `ADAPTIVE` por continuidad con el fix anterior del mismo flujo.
