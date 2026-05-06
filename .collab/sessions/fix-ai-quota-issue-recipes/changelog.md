# Changelog

## [1.0.0] - 2026-05-06
### Fixed
- **Recipes AI Flow**: Solucionado un error crítico donde se presentaba falsamente un mensaje de "Cuota de Gemini Agotada" en `/dashboard/recetas`. 
  - La raíz del problema era un error de validación 400 Bad Request causado por enviar `mealSectionTargets` con `count = 0`, lo cual era rechazado por el backend DTO.
  - El error real quedaba oculto por culpa de un mensaje `toast.error` forzado de forma manual (hardcoded) en `RecipesClient.tsx`.
  - Ahora se filtran los items en 0 antes de enviar a la IA, y el mensaje de error refleja de manera fidedigna la respuesta del servidor.
