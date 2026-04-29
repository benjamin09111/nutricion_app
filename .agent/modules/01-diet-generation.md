# Especificacion Tecnica: Modulo 1 - Generacion de Dietas

## 1. Proposito

Construir y validar la base estrategica del plan nutricional.

El modulo no debe tomar decisiones medicas autonomas. Solo propone, valida y deja todo editable.

## 2. Estado actual

Existe una primera capa funcional:

- validacion de alimentos contra restricciones,
- compatibilidad de recetas con restricciones,
- apoyo AI para casos donde haya API disponible,
- orquestacion de drafts via `Project`.

## 3. Entrada y salida

### Entrada

- `PatientId`
- restricciones clinicas
- objetivos nutricionales
- base de ingredientes/alimentos permitidos

### Salida

- `DietDraft`
- lista base permitida
- conflictos detectados
- sugerencias de revision

## 4. Modelo de datos

Entidades que participan hoy:

- `Patient`
- `Consultation`
- `Project`
- `Creation`
- `Ingredient`

## 5. Contratos actuales

- `POST /diet/verify-foods`
- `POST /recipes/compatible`
- `POST /recipes/ai-fill`
- `POST /recipes/quick-ai-fill`

## 6. Reglas de negocio

- La validacion debe ser explicable.
- Si hay AI, debe existir fallback deterministico.
- Todo output debe poder editarse manualmente.
- Restricciones clinicas ganan sobre preferencias.

## 7. Propuesta de evolutivo

- Generador de dietas desde plantilla.
- Lectura de PDFs historicos.
- Guardado de borradores de dieta.
- Versionado de cambios por proyecto.

