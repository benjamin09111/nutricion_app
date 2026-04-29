# Especificacion Tecnica: Modulo 6 - Generador de Platos

## 1. Proposito

Transformar ingredientes y porciones en recetas/platos reutilizables.

## 2. Estado actual

Existe funcionalidad real en backend y frontend:

- listado de recetas,
- creacion y edicion,
- estimacion de macros,
- busqueda de compatibilidad,
- autofill con AI.

## 3. Modelo de datos

- `Recipe`
- `RecipeIngredient`
- `Ingredient`
- `Creation` cuando el plato se guarda como artefacto reusable

## 4. Contratos actuales

- `POST /recipes`
- `POST /recipes/estimate-macros`
- `POST /recipes/compatible`
- `POST /recipes/ai-fill`
- `POST /recipes/quick-ai-fill`
- `GET /recipes`
- `GET /recipes/:id`
- `PATCH /recipes/:id`
- `DELETE /recipes/:id`

## 5. Frontend

- `/dashboard/recetas`
- `/dashboard/platos`
- `/dashboard/platos/nuevo`
- `/dashboard/platos/[id]/editar`

## 6. Reglas de negocio

- Una receta debe poder editarse manualmente.
- La AI solo propone estructura o relleno.
- Los macros deben mantenerse visibles.
- La compatibilidad depende del contexto del nutricionista.

## 7. Relacion con otros modulos

- toma base desde dietas,
- alimenta carrito,
- puede terminar exportandose al entregable.

