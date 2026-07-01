# Changelog: quick-recipes-remove-recipe-metadata-payload

**Completed:** 2026-05-06
**Author:** agent
**Mode:** ADAPTIVE

## What Was Done
Se eliminó el campo `metadata` del POST a `/recipes` al guardar platos generados desde recetas rápidas, porque `CreateRecipeDto` no lo acepta y el backend ya construye su propia metadata con `tags`, `mealSection` y `customIngredients`.
