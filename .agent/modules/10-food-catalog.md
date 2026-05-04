# Especificacion Tecnica: Modulo 10 - Catalogo de Alimentos

Este documento refleja el estado real del modulo de alimentos/ingredientes.

## 1. Proposito

El modulo permite gestionar el catalogo de ingredientes, sus marcas, categorias, tags y preferencias por nutricionista.

Sirve como base para:

- la dieta,
- las recetas,
- la validacion de restricciones,
- las listas de compra,
- el armado de contenido clinico.

## 2. Estado actual

Ya existe en backend y frontend.

### Frontend

- Ruta principal: `/dashboard/alimentos`
- Filtros por busqueda, categoria, tag y tab.
- Modales para crear ingrediente, crear grupo y gestionar tags.

### Backend

- CRUD de ingredientes.
- Preferencias por ingrediente.
- Precio de mercado.
- Cache por nutricionista.
- Verificacion de ownership.

## 3. Modelo de datos

Entidades relevantes:

- `Ingredient`
- `IngredientPreference`
- `IngredientBrand`
- `IngredientCategory`
- `Tag`

### `Ingredient`

- Nombre, marca, categoria.
- Macros por porcion/base.
- `isPublic`, `verified` y `nutritionistId`.
- Campo `ingredients` con soporte para modo draft.

### `IngredientPreference`

- Relacion unica por `nutritionistId` + `ingredientId`.
- Guarda favoritos, ocultos y otras marcas de preferencia.

### Apoyos

- `IngredientBrand` normaliza marcas.
- `IngredientCategory` normaliza categorias.
- `Tag` normaliza etiquetas transversales.

## 4. Contratos actuales

### `FoodsController` (`/foods`)

| Verbo | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/` | Listado principal con `search`, `category`, `tag`, `tab`, `page`, `limit` |
| `POST` | `/` | Crear ingrediente propio |
| `PATCH` | `/:id/preferences` | Cambiar favoritos, ocultos, no recomendados o tags |
| `GET` | `/market-prices` | Obtener precios de mercado |
| `GET` | `/:id` | Ver detalle |
| `PATCH` | `/:id` | Editar ingrediente |
| `DELETE` | `/:id` | Borrar ingrediente |

## 5. Reglas de negocio

- Un nutricionista solo puede editar sus ingredientes.
- Los ingredientes publicos se comparten entre cuentas.
- Los cambios invalidan cache de `foods` y `dashboard`.
- El sistema evita duplicados por nombre + marca.
- El texto de ingredientes puede ir en modo draft con un marcador interno.

## 6. Integracion con otros modulos

- `diet` usa ingredientes para validar restricciones.
- `recipes` usa ingredientes para compatibilidad y macros.
- `projects` y `creations` consumen ingredientes al construir drafts.

## 7. Pendientes conocidos

- La vista de favoritos y ocultos vive como preferencia del catalogo, no como modulo separado.
- Falta consolidar mejor la semantica de `shopping list` sobre este catalogo.
- La capa de composicion quimica aun no existe como servicio aislado.

## 8. Checklist

- [x] CRUD base de ingredientes.
- [x] Preferencias por nutricionista.
- [x] Busqueda con filtros.
- [x] Precios de mercado.
- [ ] Normalizar mejor la tabla de composicion quimica.
