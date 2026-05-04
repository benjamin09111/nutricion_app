# Especificacion Tecnica: Modulo 3 - Priorizacion (Favoritos)

## 1. Proposito

Marcar alimentos o ingredientes como favoritos o no recomendados para influir en busquedas, sugerencias y planes.

## 2. Estado actual

No vive como modulo independiente. Esta implementado dentro del catalogo de alimentos/ingredientes.

## 3. Modelo de datos

La capa de preferencia se guarda por nutricionista y por ingrediente.

Campos relevantes:

- favorito
- oculto
- no recomendado
- tags de preferencia

## 4. Contrato actual

- `PATCH /foods/:id/preferences`

## 5. Reglas de negocio

- Favoritos suben prioridad en listados y sugerencias.
- Ocultos salen del browse principal.
- No recomendados deben pesar menos en sugerencias.
- La preferencia no debe borrar el alimento original.

## 6. Uso en el producto

- afecta el catalogo,
- afecta la generacion de dietas,
- afecta la compatibilidad de recetas,
- ayuda a personalizar la experiencia del nutricionista.

