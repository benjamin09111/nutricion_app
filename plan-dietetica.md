# Plan de implementación — Módulos de Nutrición y Dietética

> Documento para que un agente (o el propio equipo) ejecute paso a paso. Cada fase indica: qué cambia, en qué archivos, por qué, y el criterio de "hecho". No implementar una fase sin haber cerrado la anterior — cada una deja el sistema en estado funcional (no dejar features a medias).

## 0. Contexto y hallazgos de la arquitectura actual

Antes de tocar código, estos son los hechos verificados en el repo que determinan las decisiones de abajo:

- `useDietState` ([frontend/src/features/diet/hooks/useDietState.ts](frontend/src/features/diet/hooks/useDietState.ts)) ya soporta trabajar **sin paciente** (`selectedPatient` puede ser `null`; `ensureProjectForWorkflow` ya crea `Project.mode = "GENERAL"` cuando no hay paciente). Es decir, la base para "plantillas sin paciente" ya existe parcialmente — no hay que reescribir el hook desde cero, hay que **extraerlo y generalizarlo**.
- `Creation.type` en Prisma ([backend/prisma/schema.prisma](backend/prisma/schema.prisma) línea ~118) es un `String` libre, sin enum ni validación de valores permitidos en `creations.service.ts`. **Agregar un tipo nuevo (`DIET_TEMPLATE`) no requiere migración de base de datos ni cambios de backend** — es puramente un valor de convención en el frontend. Esto simplifica mucho la Fase 2.
- `Project.mode` ya es `"CLINICAL" | "GENERAL"`. Ya existe la noción de "proyecto sin paciente" a nivel de datos.
- `/dashboard/rapido` (`QuickDeliverableClient.tsx`) es una implementación **completamente paralela** a `/dieta`: tipos propios (`QuickMeal`, `QuickPatient`, `QuickWeekDay`), su propio export a PDF (`downloadFastDeliverablePdf`), su propia guía de porciones (`buildExchangeGuideForPatient`). No comparte `useDietState` ni los componentes `Diet*Section`. Esto confirma que unificar no es "borrar uno", es decidir cuál arquitectura sobrevive y migrar la otra.
- El entregable (`DeliverableClient.tsx`) ya tiene contempladas las secciones `exchangePortions`, `pathologyInfo`, etc. — no hay que inventarlas, solo conectarlas bien a los módulos de origen.
- Sidebar ([frontend/src/components/layout/Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx)) ya tiene la sección "Nutrición y Dietética" con: Entregable Rápido, Pautas de Alimentación, Recetas, Entregable Personalizado, Fitness (bloqueado). Aquí es donde se reflejan los cambios de navegación.

### 0.1 Riesgo arquitectónico adicional (detectado en revisión final — no ignorar)

No son solo `/dieta` y `/rapido` los que están duplicados. Al revisar el resto de los módulos del Sidebar aparecen **cuatro implementaciones paralelas** del mismo problema (paciente + alimentos/recetas + export PDF), cada una con sus propios tipos TypeScript y su propio exportador:

| Módulo | Archivo | Tipos propios | Exportador PDF propio |
|---|---|---|---|
| `/dieta` | `DietClient.tsx` + `useDietState` | — (es la base a conservar) | `downloadDietPdf` |
| `/rapido` | `QuickDeliverableClient.tsx` | `QuickMeal`, `QuickPatient`, `QuickWeekDay` | `downloadFastDeliverablePdf` |
| `/rapido/recetas` | `QuickRecipesClient.tsx` | `QuickDish`, `QuickIngredient`, `QuickPatient` (otra versión, no la misma clase) | (exporta vía su propio flujo) |
| `/pautas` | `PautasAlimentacionClient.tsx` | `PautaPatient` (otra versión más de "paciente") | `downloadPautaAlimentacionPdf` |

Esto importa porque **la Fase 1 de este plan (unificar `/dieta` + `/rapido`) deja intactas dos duplicaciones más** (`/rapido/recetas` y `/pautas`). No es un error del plan — el usuario pidió explícitamente unificar solo `/dieta` y `/rapido` en esta ronda — pero el agente que ejecute esto debe saber que:
1. Existen al menos 3 definiciones de "paciente" distintas en el frontend (`QuickPatient` en dos archivos distintos con formas diferentes, `PautaPatient`, y el `DietPatient` de `features/diet`). Cualquier trabajo futuro de consolidación debe partir por unificar ese tipo antes que la UI.
2. `/rapido/recetas` (ítem "Recetas" del Sidebar) es la implementación actual de la idea del brainstorming *"recetas -> permite dar a un paciente un documento solo con recetas"*. Cuando llegue el turno de tocar este módulo, debe evaluarse si sigue siendo standalone o si pasa a ser una vista filtrada de `DietRecipesSection` (mismo patrón que ya se aplicó al decidir la Fase 1).
3. No hay que "arreglar" `/pautas` ni `/rapido/recetas` en esta ronda, pero si se toca `useDietState` para generalizarlo (Fase 2), conviene diseñarlo pensando en que estos dos módulos son candidatos naturales a la misma base más adelante — evita tener que rehacer el hook una segunda vez.

**Regla de oro para todo el plan:** no crear una segunda implementación de algo que ya existe. Si una función/lógica ya está en `useDietState`, `diet-helpers.ts` o los componentes `Diet*Section`, extraerla y reutilizarla — no copiarla.

---

## 1. Unificar `/dieta` y `/rapido`

### 1.1 Decisión de fondo
`/dieta` (wizard de 5 pasos: Info general → Dieta → Recetas y porciones → Carrito → Plan final) es la arquitectura que debe sobrevivir, porque:
- Ya está modularizada en secciones (`Diet*Section`) reutilizables.
- Ya integra con `Project`/`Creation` de forma consistente (`activeDietCreationId`, etc.).
- `/rapido` resuelve un caso de uso real (atención rápida, pauta simple) pero con una implementación desechable.

`/rapido` no desaparece como **caso de uso**, se convierte en un **modo de entrada** al mismo wizard.

### 1.2 Cambios concretos

1. En `useDietState`, agregar un modo `flowMode: "quick" | "full"` (o reutilizar `dietTags`/metadata si ya existe algo similar — revisar antes de agregar estado nuevo).
2. En `DietClient.tsx` ([frontend/src/app/dashboard/dieta/DietClient.tsx](frontend/src/app/dashboard/dieta/DietClient.tsx)), condicionar `WIZARD_STEPS`:
   - Modo **rápido**: solo `["Info general", "Dieta", "Plan final"]` — salta Recetas/Carrito o los deja como opcionales colapsados.
   - Modo **completo**: los 5 pasos actuales.
3. Migrar lo específico y valioso de `QuickDeliverableClient.tsx` que NO existe hoy en `/dieta`:
   - `buildExchangeGuideForPatient` (guía de intercambio de porciones) → mover a `lib/exchange-portions.ts` si no está ya ahí, consumir desde `DietFinalPlanSection` con el checkbox de la sección 3.1 de este plan.
   - `downloadFastDeliverablePdf` → evaluar si se puede fusionar con `downloadDietPdf` (features/pdf/pdfExport) pasando un flag de "modo simple" en vez de mantener dos exportadores de PDF distintos.
   - Tipo de meal semanal (`QuickWeekDay`, planificación por día de semana) → si `DietRecipesSection` no cubre la vista semanal, portar esa UI puntual, no todo el archivo.
4. Punto de entrada: la ruta `/dashboard/rapido` pasa a ser un **redirect** a `/dashboard/dieta?mode=quick` (o un query param equivalente), manteniendo el link del Sidebar pero apuntando al wizard unificado con el paso reducido activado por defecto.
5. Backend: `Creation.type = "FAST_DELIVERABLE"` puede seguir usándose para no romper creaciones históricas de usuarios existentes, pero las nuevas creaciones desde el modo rápido deberían guardarse como `type: "DIET"` con `metadata.flowMode: "quick"` para que todo quede en el mismo lugar (Creaciones, importación, etc. ya filtran por `type`).
6. **Migración de datos:** no borrar `/rapido` de golpe. Mantener la ruta funcionando en modo "solo lectura/redirect" durante un período, y en `creaciones` (listado) seguir reconociendo `FAST_DELIVERABLE` como alias legible de "Entregable Rápido" aunque ya no se generen nuevas.

### 1.3 Criterio de aceptación
- Un nutricionista puede crear una pauta rápida sin pasar por Recetas/Carrito, y luego "expandirla" al wizard completo sin perder datos (mismo `Creation`/`Project`).
- No queda ningún componente de `/rapido` duplicando lógica que ya vive en `useDietState` o `diet-helpers.ts`.
- El Sidebar sigue mostrando "Entregable Rápido" como entrada directa al modo rápido (no lo elimines, es una entrada de UX válida — solo cambia el destino).

---

## 2. Nuevo módulo: "Plantillas de Dieta"

### 2.1 Justificación (decisión ya tomada con el usuario)
No es un checkbox dentro de `/dieta`, es un módulo propio: una plantilla de dieta (ej. "Vegetariano base", "Diabético tipo 2") **no tiene paciente ni entregable**, es una biblioteca de bases reutilizables que luego se importan hacia `/dieta` para personalizar. Mezclarlo dentro del wizard de paciente lo escondería.

### 2.2 Cómo construirlo SIN duplicar código
1. Crear `frontend/src/app/dashboard/plantillas-dieta/` con un `PlantillaDietaClient.tsx` que reutilice:
   - `useDietState` (ya soporta `selectedPatient = null`).
   - `DietConstraintSection`, `DietPlannerSection`, `DietMacroSection` tal cual — son agnósticas de paciente ya (revisar `DietPatientSection` es la única que asume paciente; en este módulo simplemente no se renderiza esa sección).
2. Wizard reducido a 2 pasos: "Info general de la plantilla" (nombre, tags de clasificación tipo `#vegetariano`) + "Dieta" (selección de alimentos/grupos). Sin Recetas/Carrito/Plan final — esos son conceptos de paciente.
3. Guardar como `Creation.type: "DIET_TEMPLATE"` (nuevo valor, sin cambios de schema necesarios — ver hallazgo en sección 0). Metadata: `{ isTemplate: true }`.
4. En `/dashboard/dieta`, el botón "Importar pauta" (`ImportCreationModal`, ya usado por `handleImportCreation`) debe permitir filtrar por `type: "DIET_TEMPLATE"` además de `"DIET"` — reutilizar el mismo modal, solo ampliar el filtro de tipos permitidos (mismo patrón que `openFilteredCreationImport` en `DeliverableClient.tsx`).
5. Al importar una plantilla en `/dieta`, **no** trae paciente ni restricciones de paciente — solo alimentos/grupos/macro base. Las restricciones clínicas del paciente real se agregan después, encima de la plantilla (unión, no reemplazo).

### 2.3 Ubicación en el Sidebar
Agregar bajo el grupo "Nutrición y Dietética", junto a "Entregable Personalizado":
```
{ name: "Plantillas de Dieta", href: "/dashboard/plantillas-dieta", icon: Layers /* o similar */ }
```

### 2.4 Anti-duplicación de recetas (mencionado por el usuario)
Cuando se generen recetas en lote para un repertorio general (no atado a paciente), mantener un registro de los últimos N títulos/ingredientes generados y pasarlo al prompt de IA como lista de "no repetir". Aplica tanto a "Plantillas de Dieta" como al futuro repertorio de "Mis Recetas" (sección 3.3).

### 2.5 Criterio de aceptación
- Se puede crear, guardar y reutilizar una plantilla sin nunca seleccionar un paciente.
- Importar una plantilla en `/dieta` no sobreescribe al paciente ya vinculado ni sus restricciones.
- Cero componentes nuevos que reimplementen selección de alimentos/grupos — todo reutilizado de `features/diet`.

---

## 3. Ajustes transversales (valor alto, esfuerzo bajo)

### 3.1 Checkbox de "Porciones e intercambio" en todos los módulos
- Ya existe como sección fija (`exchangePortions`) en `DELIVERABLE_SECTIONS` de `DeliverableClient.tsx`. Extender el mismo patrón (checkbox en el último paso del wizard) a: `/dieta` (modo completo y rápido), `/dashboard/pautas`, `/dashboard/fitness` (cuando se desbloquee), y al nuevo "Plantillas de Dieta" no aplica (no hay entregable).
- Reutilizar `buildExchangeGuideForPatient` (lib/exchange-portions.ts) como única fuente de verdad del cálculo — no reimplementar el cálculo de intercambio en cada módulo.

### 3.2 Recetas: reutilizar dieta completa (no solo alimentos manuales/grupo)
- En `DietRecipesSection`, agregar una opción "Cargar desde dieta actual" que tome `state.allGroupsToRender` completo como contexto para la IA, además de la opción actual de selección manual/grupo. Esto ya es consistente con el flujo del wizard (paso 2 → paso 3 en la misma sesión), así que es más "conectar datos que ya están en memoria" que construir algo nuevo.

### 3.2bis Recetas: usar "Mis Recetas" como semilla de estilo para la IA (no como importación literal)
- Distinto del punto anterior: 3.2 es "dame el contexto de ESTA dieta"; esto es "dame inspiración de MIS recetas ya creadas en general". Al generar recetas nuevas, pasar al prompt de IA un resumen de 3-5 recetas del repertorio del nutricionista (título + ingredientes clave, de la Fase 3.3) con instrucción explícita de tomarlas como referencia de estilo/ingredientes habituales, no de copiarlas ni de ignorarlas por completo. Esto evita el efecto "recomendación genérica que no calza con lo que el profesional suele indicar" y de paso reduce el problema de repetición (3.3/2.4) porque ancla la generación a variedad real ya validada por el usuario en vez de aleatoriedad pura del modelo.

### 3.2ter Alta rápida de alimentos que no están en la tabla
- Problema real detectado por el usuario: si la búsqueda de alimentos carga el JSON completo en el cliente para poder agregar uno nuevo rápido, la UI se pone lenta a medida que la tabla crece. La búsqueda YA es server-side con debounce (`useDietState.ts`, el `useEffect` que llama a `/foods?search=...&limit=20` — ver también `handleCreateManualFood`), así que **no hay que construir esto desde cero, hay que no romperlo** al tocar el hook en las fases anteriores.
- Mejoras concretas pendientes sobre esa base ya existente:
  1. Auto-sugerir el grupo del alimento manual nuevo por reglas simples de nombre (ej. "pollo" → "Carnes y Vísceras") en vez de dejar siempre "Varios" por defecto (`handleCreateManualFood` hoy manda `category: activeGroupForAddition || "Varios"` sin heurística).
  2. Cachear/priorizar en la búsqueda los alimentos que el nutricionista ya marcó como favoritos o creó manualmente antes (hoy `toggleFavorite` ya persiste `isFavorite` en backend vía `/foods/:id/preferences` — falta que la búsqueda ordene por eso en vez de solo por texto).
  3. Aplica igual para el módulo "Plantillas de Dieta" (Fase 2) y para `/rapido` una vez migrado — es la misma búsqueda de `useDietState`, no una nueva por módulo.

### 3.3 Repertorio general de "Mis Recetas"
- Nueva tab en `/dashboard/rapido/recetas` (o donde termine viviendo tras la fusión de la sección 1) para listar recetas generadas sueltas (no atadas a paciente), guardadas como `Creation.type: "RECIPE"` o `"RECETARIO"` (ya existen ambos tipos — definir cuál es cuál antes de usar los dos indistintamente; si no hay diferencia real de uso hoy, consolidar en uno solo para evitar confusión al filtrar creaciones).
- Cada receta debe incluir preparación generada por IA (ya es un requisito confirmado, no opcional).
- Aplicar la mitigación de repetición de la sección 2.4.

### 3.4 Carrito: botón "Calcular precio aproximado" bloqueado
- Ya está bien decidido como placeholder (roadmap futuro). Implementar el botón deshabilitado con tooltip/toast "Próximamente" (mismo patrón que los items `locked: true` del Sidebar — reutilizar ese componente/estilo, no inventar uno nuevo).

---

## 4. Mejoras clínicas de fondo (roadmap, no bloqueante para las fases anteriores)

Estas no bloquean la unificación pero deben quedar registradas para no perderse:

1. **Separar "alergia" de "preferencia"** en el modelo de restricciones del paciente. Hoy `activeConstraints`/`dietRestrictions` es una lista plana de strings sin distinción de severidad. Una alergia debería bloquear duro en `includedFoods` (useDietState.ts, la lógica de filtrado por `normalizedConstraints` ya existe ahí — extenderla con un nivel de severidad en vez de solo nombre).
2. **Historial de versiones de una dieta/plantilla** — cuando se edita una `Creation` ya guardada (`editingCreationId` en `useDietState`), guardar un snapshot anterior en vez de sobreescribir directo, para poder comparar "qué cambió desde el último control".
3. **Validación nutricional automática mínima** — antes de exportar el PDF, chequear que la pauta no esté muy por debajo de mínimos seguros (proteína, kcal) y advertir al profesional, no solo confiar en `handleVerifyRestrictions` (hoy es un placeholder: `"La validación de restricciones estará disponible próximamente"` en useDietState.ts línea ~1249).
4. **Vínculo con seguimiento/controles del paciente** — conectar `Creation`/`Project` con la ficha clínica del paciente para poder ver evolución entre entregables sucesivos, no solo el entregable puntual actual.

---

## 5. Orden de ejecución recomendado

1. Fase 1 (unificar `/dieta` + `/rapido`) — es la de mayor impacto en deuda técnica, hazla primero para no construir el módulo de plantillas sobre una base que va a cambiar.
2. Fase 2 (Plantillas de Dieta) — depende de que `useDietState` ya esté generalizado por la Fase 1.
3. Fase 3 — se puede paralelizar por partes una vez cerradas 1 y 2, son independientes entre sí.
4. Fase 4 — backlog, abordar una por una cuando haya espacio, no bloquea nada de lo anterior.

## 6. Buenas prácticas a seguir durante la ejecución

- No crear abstracciones nuevas "por si acaso" — si `Diet*Section` ya sirve, úsalo tal cual.
- No dejar rutas rotas: `/rapido` debe redirigir, nunca dar 404, durante toda la transición.
- Cualquier nuevo `Creation.type` (`DIET_TEMPLATE`) debe agregarse también a los filtros existentes de importación (`ImportCreationModal`, `openFilteredCreationImport`) para que aparezca donde corresponde y NO aparezca donde no corresponde (ej. no debe aparecer como opción de "Entregable" en `DeliverableClient.tsx`, ya que una plantilla no es un entregable de paciente).
- Cada fase debe dejar `npm run build` (frontend) y los tests existentes en verde antes de pasar a la siguiente.
- No tocar el modelo de precios del carrito (mantenerlo bloqueado) salvo que el usuario lo pida explícitamente — está fuera de este plan.
