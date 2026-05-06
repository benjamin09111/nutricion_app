# Changelog: quick-recipes-import-only-patient

**Completed:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## What Was Done
Se eliminó la creación rápida de paciente en recetas rápidas y se dejó la generación con IA funcionando tanto con paciente importado como sin paciente.

## Key Decisions

- El flujo de paciente dentro de `rapido/recetas` queda solo como importación/selección de pacientes existentes.
- La IA puede generar platos sin paciente y, en ese caso, el payload se envía con `patient: null`.
- La exportación de PDF sigue requiriendo paciente vinculado, porque ese flujo aún consume datos del paciente.

## Files Changed
- `frontend/src/app/dashboard/rapido/recetas/QuickRecipesClient.tsx`

## What's Next

- Probar manualmente `/dashboard/rapido/recetas` generando una vez sin paciente y otra con paciente importado.
