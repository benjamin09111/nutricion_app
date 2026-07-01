# Walkthrough

- Editado `RecipesClient.tsx`:
  - Se modificó la llamada a `fetchApi("/recipes/quick-ai-fill")` en la función `handleQuickGenerateAI` para filtrar el arreglo `mealSectionTargets` (`mealSectionTargets.filter((t) => t.count > 0)`). Esto iguala el comportamiento con `QuickDeliverableClient.tsx` de `/rapido`.
  - Se eliminó el texto estático `description: "Verifica los logs de la consola o la cuota de Gemini."` del `toast.error`, el cual enmascaraba el verdadero origen del fallo e instruía de forma engañosa al usuario final.
