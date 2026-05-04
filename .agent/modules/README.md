# Definición de Módulos (Workflows de Desarrollo)

Aquí se almacenan los documentos de diseño tecnico ("Specs") para cada modulo.
El agente debe consultarlos antes de escribir codigo cuando toque el dominio correspondiente.

## Estructura de cada archivo de modulo (.md)

1.  **Propósito**: Qué hace.
2.  **Modelo de Datos (Schema)**: Tablas SQL vs campos JSONB.
3.  **API Endpoints**: Defines los contratos (DTOs).
4.  **Lógica Core**: Algoritmos, integraciones.
5.  **Pasos de Implementación**: Checklist para el Agente.

## Estado de las specs

- `[x]` `01-diet-generation.md`
- `[x]` `02-shopping-list.md`
- `[x]` `03-favorites.md`
- `[x]` `04-chemical-table.md`
- `[x]` `05-patient-crm.md`
- `[x]` `06-dish-generator.md`
- `[ ]` `07-schedule-optimizer.md`
- `[x]` `08-visual-guides.md`
- `[ ]` `09-ecommerce.md`
- `[x]` `10-food-catalog.md`
- `[ ]` `11-engagement-bot.md`

## Regla

- Las specs deben reflejar el codigo real si el modulo ya existe.
- Las specs pendientes deben describir el contrato esperado y el estado actual.
