# Especificación Técnica: Módulo 10 - Catálogo de Alimentos

Este documento define la arquitectura, diseño de datos y endpoints para el Sistema de Gestión de Alimentos y Preferencias del Nutricionista.

## 1. Propósito y Flujo de Usuario
Permitir al nutricionista interactuar con un **Repositorio Oficial** de alimentos, personalizando su "Vista" mediante filtros de exclusión (ocultar) y priorización (favoritos), además de crear sus propios alimentos personalizados.

### Vistas Principales (Frontend)
El módulo tendrá un layout con pestañas:
1.  **Catálogo General (Buscador)**: Vista principal optimizada (sin scroll infinito). Depende 100% de la barra de búsqueda y filtros. Muestra alimentos Oficiales + Personalizados (activos).
2.  **Favoritos**: Lista de alimentos marcados con alta prioridad.
3.  **Ocultos/Papelera**: Lista de alimentos del repositorio oficial que el nutricionista ha decidido "banear" de sus dietas.

## 2. Modelo de Datos (Prisma Schema)

Utilizaremos una estrategia mixta: Tablas rígidas para datos core y JSONB para detalles extensibles.

### A. Tabla `Food` (Repositorio Global y Custom)
Almacena tanto los alimentos oficiales como los creados por nutris.

```prisma
model Food {
  id          String   @id @default(uuid())
  name        String   // Nombre estandarizado (ej: "Yogurt Batido Vainilla")
  brand       String?  // Marca (ej: "Colun", "Soprole")
  category    String   // Categoría para Supermercado (ej: "Lácteos", "Despensa")
  
  // Macros Core (Por 100g/ml) - Rígido para cálculo rápido
  calories    Float
  proteins    Float
  carbs       Float
  fats        Float
  
  // Datasheet Chileno & Filtros
  tags        String[] // ["VEGAN", "KETO", "SELLO_ALTO_AZUCAR", "LIBRE_DE_GLUTEN"]
  ingredients String?  // Texto completo de ingredientes para análisis
  
  // Detalle Micros y Metadata (Flexible)
  micros      Json?    // { "sugar": 10, "sodium": 50, "fiber": 2 ... }
  serving     Json?    // { "unit": "ml", "g_per_serving": 125, "price_estimate": 450 }
  
  // Propiedad
  isPublic       Boolean  @default(false)
  nutritionistId String?
  
  createdAt   DateTime @default(now())
  
  // Relaciones
  preferences FoodPreference[]
  
  @@index([name])
  @@index([category])
  @@index([tags])
  @@map("foods")
}
```

### B. Tabla `FoodPreference` (Personalización)
Gestiona la lógica de "Vista Personalizada". Es una tabla pivote.

```prisma
model FoodPreference {
  id             String  @id @default(uuid())
  nutritionistId String
  foodId         String
  
  isFavorite     Boolean @default(false) // Prioridad en algoritmos
  isHidden       Boolean @default(false) // Soft-delete lógico (solo para este nutri)
  
  food           Food    @relation(fields: [foodId], references: [id])
  
  @@unique([nutritionistId, foodId]) // Un nutri solo tiene 1 preferencia por alimento
  @@map("food_preferences")
}
```

## 3. Lógica de Negocio (Service Layer)

### Algoritmo de Búsqueda ("The View")
Al buscar alimentos (`GET /foods`), el servicio debe ejecutar esta lógica:
1.  Buscar en `Food` donde `(isPublic = true OR nutritionistId = CURRENT_USER)`.
2.  Hacer un `LEFT JOIN` con `FoodPreference`.
3.  **Filtrar**: Excluir si `FoodPreference.isHidden == true`.
4.  **Ordenar**: Si `FoodPreference.isFavorite == true`, van primero.

### Acciones
- **Toggle Hidden**: Crea/Actualiza `FoodPreference` con `isHidden = !current`. Si un alimento oficial se oculta, desaparece de la búsqueda principal y va a la pestaña "Ocultos".
- **Toggle Favorite**: Similar al anterior. Afecta el peso del algoritmo de generación de dietas.
- **Crear Custom**: Inserta en `Food` con `isPublic = false` y `nutritionistId`.

## 4. API Endpoints (NestJS)

### Controller: `FoodsController` (`/foods`)

| Verbo | Ruta | Descripción | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Búsqueda principal paginada. | `?q=pollo&category=meat&page=1` |
| `GET` | `/favorites` | Lista solo favoritos. | - |
| `GET` | `/hidden` | Lista solo ocultos. | - |
| `POST` | `/preference/:id` | Marcar/Desmarcar pref. | `{ type: 'FAVORITE' \| 'HIDDEN', value: boolean }` |
| `POST` | `/custom` | Crear alimento propio. | DTO `CreateFoodDto` |
| `DELETE` | `/custom/:id` | Borrar alimento propio (Hard delete). | - |

## 5. Implementación Frontend (Next.js)

- **Componente `FoodSearchTable`**:
  - Input de búsqueda con *debounce*.
  - Tabla compacta (Nombre, Cal, P, C, G, Acciones).
  - Acciones rápidas: Icono Corazón (Fav), Icono Ojo Tachado (Ocultar).
- **Estado Local**: Usar React Query para invalidar caché al cambiar preferencias (optimistic updates recomendados para los iconos).

## 6. Pasos de Desarrollo (Checklist)

- [ ] Generar módulo NestJS: `nest g resource modules/foods`.
- [ ] Definir Schema Prisma y migrar DB.
- [ ] Implementar `FoodsService.findAll()` con la lógica de filtrado/join.
- [ ] Implementar endpoints de preferencia.
- [ ] Construir UI con pestañas en `/dashboard/alimentos`.
