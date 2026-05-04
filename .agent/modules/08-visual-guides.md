# Especificacion Tecnica: Modulo 8 - Guias Visuales

## 1. Proposito

Construir el entregable final y los recursos visuales o educativos que acompañan al paciente.

## 2. Estado actual

Ya existe una base real:

- biblioteca de resources,
- secciones reutilizables,
- variables personalizables,
- extraccion de texto desde PDF,
- frontend de entregable y recursos,
- utilidades PDF en el frontend.

## 3. Modelo de datos

- `Resource`
- `ResourceSection`
- `Creation` tipo `DELIVERABLE`
- `Project.activeDeliverableCreationId`

## 4. Contratos actuales

- `GET /resources`
- `GET /resources/sections`
- `POST /resources/sections`
- `GET /resources/:id`
- `POST /resources`
- `POST /resources/resolve-variables`
- `PATCH /resources/:id`
- `DELETE /resources/:id`
- `POST /resources/extract-text`

## 5. Frontend

- `/dashboard/entregable`
- `/dashboard/rapido`
- `/dashboard/recursos`
- `/dashboard/recursos/nuevo`
- `/dashboard/recursos/editar/[id]`

## 6. Reglas de negocio

- El contenido debe ser editable antes del export.
- Las variables deben resolverse de forma segura.
- Los recursos globales y propios deben coexistir.
- El PDF final debe conservar branding y tono de voz.

## 7. Pendiente estructural

- Unificar el pipeline de compilacion del entregable.
- Definir mejor la fuente de verdad del contenido final.
- Separar las plantillas por tipo de output.

