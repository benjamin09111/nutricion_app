# Especificacion Tecnica: Modulo 4 - Tabla de Composicion Quimica

## 1. Proposito

Mantener la composicion nutricional como fuente confiable para calculos de dieta, recetas y carrito.

## 2. Estado actual

La capa existe distribuida en varias piezas:

- macros en `Ingredient`,
- estimacion de macros en `recipes`,
- verificacion de restricciones en `diet`,
- precios y metadata en el catalogo.

Todavia no hay un servicio unico de composicion quimica.

## 3. Datos relevantes

- calorias
- proteinas
- grasas/lipidos
- carbohidratos
- azucares
- fibra
- sodio
- porcion base

## 4. Reglas de negocio

- Los calculos deben normalizarse por unidad base.
- Cambiar un ingrediente debe recalcular totales dependientes.
- El backend debe ser la fuente de verdad.
- No debe haber silencios en cambios de macros.

## 5. Integracion actual

- `foods` administra la materia prima.
- `recipes` estima totales.
- `diet` detecta conflictos nutricionales.
- `projects` y `creations` almacenan el estado final del flujo.

## 6. Pendiente estructural

- Extraer un servicio unico de calculo.
- Definir formulas estandar.
- Versionar tablas o referencias de composicion.

