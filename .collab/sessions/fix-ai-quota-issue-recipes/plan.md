# Plan

## Objetivo
Solucionar el falso error de "cuota de Gemini agotada" en la generación de recetas con IA dentro del módulo `/dashboard/recetas`.

## Archivos Involucrados
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx`

## Tareas
1. **Corregir Filtro de Payload**: En `/rapido`, los `mealSectionTargets` se filtran antes de enviar al backend para no enviar conteos de `0`. En `/recetas`, se enviaba toda la estructura, provocando que la validación estricta de DTO (`@Min(1)`) del backend fallara con error de Request Inválida (400 Bad Request).
2. **Corregir Mensaje Toast**: El mensaje `toast.error` en el catch del request en `/recetas` tenía escrito de forma "hardcodeada" el texto: "Verifica los logs de la consola o la cuota de Gemini". Esto ocultaba el error real del backend y engañaba al usuario haciéndole creer que era un problema de la IA.
