# Especificacion Tecnica: Modulo 2 - Lista de Supermercado

## 1. Proposito

Convertir la estrategia nutricional y las recetas en una lista accionable de compra.

## 2. Estado actual

El flujo existe de forma distribuida:

- frontend en `/dashboard/carrito`,
- `Project` guarda la creacion activa de carrito,
- `Creation` puede representar una lista tipo `SHOPPING_LIST`.

Falta una capa backend dedicada y un contrato unico.

## 3. Entrada y salida

### Entrada

- `DietDraft`
- `RecipePortionDraft`
- ventana temporal semanal o mensual
- preferencias de equivalencia

### Salida

- `ShoppingListDraft`
- items agrupados por categoria
- totales proyectados
- costo estimado

## 4. Modelo de datos

- `Project.activeCartCreationId`
- `Creation.type = SHOPPING_LIST`
- `Creation.content` como JSON flexible
- `Creation.metadata` para costos, categorias y equivalentes

## 5. Contratos esperados

Proximamente deberia existir:

- `POST /shopping-lists/build`
- `GET /shopping-lists/:projectId`
- `PATCH /shopping-lists/:id`
- `POST /projects/:id/cart`

## 6. Reglas de negocio

- La lista debe ser editable.
- Los equivalentes deben conservar macros y contexto.
- La agrupacion por categorias debe ser estable.
- El calculo debe respetar la frecuencia semanal.

## 7. Integracion con otros modulos

- recibe datos desde `diet`,
- recibe porciones y platos desde `recipes`,
- se guarda y versiona en `projects` y `creations`.

