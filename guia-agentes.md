# NutriNet · Guía de arquitectura de agentes de IA

**Para:** el agente de desarrollo (y cualquier persona que programe NutriNet).
**Versión:** 1.0 · 3 de noviembre de 2026.
**Objetivo inmediato:** una demo sin login, medible y defendible ante el jurado de Jump Chile (congelamiento de métricas: 15 de noviembre; final: 24 de noviembre de 2026).
**Objetivo de fondo:** una arquitectura que crezca sin reescribirse hasta ser la plataforma clínica de nutricionistas de todo Chile.

---

## 0. Cómo usar esta guía (léelo primero, agente)

1. Lee la guía completa antes de escribir código. Las secciones 2 (reglas) y 5 (contrato de agente) mandan sobre todo lo demás.
2. **Si el repositorio ya existe, adáptate a él.** No reescribas lo que funciona: incorpora esta estructura de a poco, empezando por el motor nutricional y el agente de pauta.
3. Construye en el orden de la sección 15. No adelantes fases.
4. Si un dato clínico (fórmula, tabla, rango, umbral) no está en el repositorio, **no lo inventes**: crea un `TODO(clinica)` y pregúntale al equipo. Los valores clínicos los valida la asesora clínica.
5. Las APIs de las librerías cambian rápido. Antes de copiar un ejemplo, verifica firmas contra la documentación oficial de la versión instalada (PydanticAI y OpenRouter, en especial).
6. Al terminar cada tarea, reporta: qué construiste, cómo se prueba, qué quedó pendiente y qué supuestos tomaste.

**Stack asumido** (el de la guía anterior del equipo): Python 3.12, FastAPI, Pydantic v2, PydanticAI, OpenRouter, PostgreSQL. El frontend es el que ya existe en el repositorio. Si algo de esto no coincide con el repositorio, pregunta antes de cambiarlo.

---

## 1. Contexto del producto en 30 segundos

NutriNet es una plataforma web para nutricionistas en Chile. Quien la usa y paga es la nutricionista; el paciente recibe el resultado en un portal.

El núcleo es la **pauta alimentaria trazable**: la nutricionista completa la ficha del paciente, NutriNet calcula requerimientos y arma un borrador de pauta usando el **sistema chileno de porciones de intercambio**, la nutricionista lo revisa, ajusta y aprueba, y el paciente lo recibe con recetas y lista de compras.

La tesis de producto, que la arquitectura debe hacer cumplir, es:

> **La IA calcula, el nutricionista decide, el paciente se queda.**

En la práctica, "la IA calcula" significa que el sistema calcula. Los números los produce código determinista; el LLM solo elige y redacta.

---

## 2. Reglas no negociables

Cada regla tiene una prueba automática asociada (sección 13). Ningún cambio se mezcla si rompe una de ellas.

| #   | Regla                                                                                                                       | Cómo se cumple en código                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **El LLM nunca produce cifras clínicas.** Kcal, macronutrientes, gramos y porciones por grupo salen del motor determinista. | Los esquemas de salida de los agentes no tienen campos numéricos clínicos, salvo `portions` dentro de los cupos ya definidos por el código y validados después. |
| R2  | **Nada llega al paciente sin aprobación humana.**                                                                           | Solo un `MealPlan` con `status="approved"` y `approved_by` puede publicarse en el portal o exportarse como PDF final.                                           |
| R3  | **Toda cifra es trazable** y cada ejecución de IA queda registrada.                                                         | Cada ítem de la pauta guarda un objeto `trace`; cada llamada al LLM crea un `AgentRun`; cada cambio humano crea un `PlanEdit`.                                  |
| R4  | **Datos mínimos al LLM.** Nunca nombre, RUT, correo, teléfono, dirección ni texto libre identificable del paciente.         | Una sola función `build_llm_payload()` con lista blanca de campos. Las pruebas fallan si aparece un campo fuera de la lista.                                    |
| R5  | **Privacidad del proveedor.** Todo tráfico a OpenRouter va con retención cero (ZDR) y sin recolección de datos.             | Un único módulo `llm_gateway.py` construye todos los modelos con esa configuración. Prohibido instanciar modelos fuera de él.                                   |
| R6  | **El modelo es configuración.** Ningún `.py` contiene un ID de modelo.                                                      | Cada agente lo lee de su `config.yaml`.                                                                                                                         |
| R7  | **Todo agente tiene límites** de solicitudes, llamadas a herramientas, tokens, costo y tiempo.                              | `UsageLimits` de PydanticAI más un `asyncio.wait_for` con timeout.                                                                                              |
| R8  | **Toda salida de un agente pasa por un validador determinista** antes de usarse.                                            | Cada agente declara su función `validate(output, deps)`. Si falla, se reintenta o se cae a la ruta determinista.                                                |
| R9  | **La demo usa solo datos ficticios.**                                                                                       | Banner fijo, pacientes precargados, sin campos de identificación, sesión que se reinicia.                                                                       |
| R10 | **Aislamiento por cuenta.** Ningún dato cruza entre nutricionistas.                                                         | Toda consulta filtra por `tenant_id` (en la demo, por `demo_session_id`).                                                                                       |

---

## 3. Arquitectura: la jerarquía recomendada

### 3.1 Principio rector

El estado del arte para sistemas de agentes en producción recomienda usar **el patrón más simple que funcione**: workflows deterministas donde los pasos se conocen, y agentes autónomos solo donde el camino depende de lo que se encuentre (ver "Building effective agents", Anthropic, https://www.anthropic.com/engineering/building-effective-agents). En salud esto es aún más importante: un supervisor hecho con un LLM agrega latencia, costo y comportamiento no reproducible justo en el flujo que hay que auditar.

Por eso la jerarquía de NutriNet tiene al **código** en la cima, a los **agentes especialistas** al medio y a las **herramientas deterministas** en la base.

### 3.2 Los tres niveles

```
NIVEL 0 · ORQUESTADOR (código, sin LLM)
  workflows/: generate_meal_plan, refine_meal_plan, approve_meal_plan, build_shopping_list
  Decide qué paso corre, en qué orden, con qué límites, y emite eventos de progreso.
        │
        ▼
NIVEL 1 · AGENTES ESPECIALISTAS (independientes, uno por carpeta)
  meal_plan_agent    → elige alimentos para cupos de porciones ya calculados
  refine_agent       → aplica pedidos en lenguaje natural ("baja 200 kcal") usando herramientas
  recipes_agent      → redacta preparaciones usando solo los alimentos y gramos de la pauta
  (fase 2) chart_summary_agent, education_agent, adherence_explainer_agent
  (fase 3) copilot_agent → router conversacional que delega en los especialistas
        │
        ▼
NIVEL 2 · HERRAMIENTAS DETERMINISTAS (compartidas, probadas, sin LLM)
  core/nutrition: requerimientos, cupos por grupo, distribución por comida, cuadre
  core/foods: base de alimentos versionada, intercambios, alérgenos, regiones
  core/validation: validadores de salida de cada agente
  core/trace: construcción de trazas
        │
        ▼
INFRAESTRUCTURA
  llm_gateway (OpenRouter, ZDR) · PostgreSQL · registro AgentRun / PlanEdit · eventos de analítica
```

### 3.3 Qué es agente y qué no

| Componente                                   | Tipo                                                | Por qué                                                                      |
| -------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Calcular requerimientos y cupos de porciones | Código                                              | Son fórmulas: deben ser exactas y auditables.                                |
| Generar el borrador de pauta                 | **Workflow** con un paso de LLM (`meal_plan_agent`) | Los pasos se conocen; la IA solo elige alimentos.                            |
| Refinar en lenguaje natural                  | **Agente** con herramientas (`refine_agent`)        | El camino depende del pedido.                                                |
| Recetas                                      | Workflow con un paso de LLM (`recipes_agent`)       | La IA redacta; las cantidades vienen del código.                             |
| Lista de compras                             | **Código**                                          | Es una suma de gramos agrupada por sección del supermercado. No necesita IA. |
| Alerta de abandono                           | **Reglas**                                          | Más barato, explicable y fácil de defender.                                  |
| Chat del paciente con la IA                  | **No se construye**                                 | Riesgo clínico alto; fuera del alcance.                                      |

Regla práctica para el futuro: **cada nueva capacidad parte como código; pasa a ser un paso de LLM solo si requiere lenguaje o juicio; pasa a ser un agente con herramientas solo si el camino es variable.**

### 3.4 Cómo se comunican los niveles

- **Orquestador → agente:** llamada directa a `run_agent(spec, input, deps)` (traspaso programático: el código decide qué agente corre).
- **Agente → herramienta:** herramientas de PydanticAI que llaman funciones de `core/`.
- **Agente → agente:** solo en fase 3, vía delegación (una herramienta del copiloto llama a otro agente pasando `usage=ctx.usage` para que el consumo se sume). Nunca dos agentes conversando libremente.

---

## 4. Estructura del repositorio

Adapta los nombres al repositorio existente; respeta la separación de responsabilidades.

```
nutrinet/
├── api/                        # FastAPI: rutas, dependencias, SSE de progreso
│   ├── main.py
│   ├── routes/ (demo.py, patients.py, meal_plans.py, events.py, leads.py)
│   └── deps.py                 # sesión de demo / tenant
├── core/
│   ├── nutrition/
│   │   ├── energy.py           # fórmulas de gasto energético
│   │   ├── targets.py          # metas de kcal y macronutrientes
│   │   ├── exchange_plan.py    # cupos de porciones por grupo (solver)
│   │   ├── distribution.py     # reparto de cupos por tiempo de comida
│   │   └── balance.py          # cuadre: totales y desviaciones
│   ├── foods/
│   │   ├── models.py
│   │   ├── repository.py       # búsqueda, filtros por alérgeno/región/grupo
│   │   └── data/               # tablas versionadas (CSV) + metadatos de fuente
│   ├── validation/             # validadores deterministas por agente
│   ├── privacy/llm_payload.py  # build_llm_payload(): lista blanca (R4)
│   └── trace/                  # construcción de trazas (R3)
├── agents/
│   ├── _base/
│   │   ├── llm_gateway.py      # ÚNICO lugar donde se crean modelos (R5, R6)
│   │   ├── spec.py             # AgentSpec, AgentLimits, carga de config.yaml
│   │   ├── runner.py           # run_agent(): límites, timeout, validación, AgentRun
│   │   └── registry.py         # registro de agentes disponibles
│   ├── meal_plan/
│   │   ├── agent.py
│   │   ├── schemas.py
│   │   ├── config.yaml
│   │   ├── prompts/v1.md
│   │   └── evals/cases/*.yaml
│   ├── refine/
│   └── recipes/
├── workflows/
│   ├── generate_meal_plan.py
│   ├── refine_meal_plan.py
│   ├── approve_meal_plan.py
│   └── shopping_list.py
├── db/ (models.py, migrations/)
├── demo/ (seed_patients.py, reset.py)
├── evals/ (run.py, report.py)
└── tests/
```

---

## 5. Contrato de agente (todos los agentes lo cumplen)

Un agente es **independiente** cuando se puede probar, versionar, evaluar y cambiar de modelo sin tocar a los demás. Por eso cada carpeta de agente contiene exactamente:

| Archivo         | Contenido                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------ |
| `config.yaml`   | Modelo, modelos de respaldo, temperatura, límites, versión de prompt.                      |
| `prompts/vN.md` | Instrucciones. Nunca se editan versiones publicadas: se crea `vN+1`.                       |
| `schemas.py`    | `Input`, `Deps` y `Output` en Pydantic. El `Output` no admite cifras clínicas libres (R1). |
| `agent.py`      | Construcción del agente y sus herramientas (máximo 5).                                     |
| validador       | Función `validate(output, deps)` en `core/validation/` (R8).                               |
| `evals/cases/`  | Casos de prueba con criterios de aceptación.                                               |

### 5.1 `config.yaml` de ejemplo

```yaml
name: meal_plan_agent
description: Elige alimentos de la base chilena para llenar cupos de porciones ya calculados.
model: "<id-de-modelo-en-openrouter>" # se elige con evals (sección 13)
fallback_models: ["<id-alternativo>"]
temperature: 0.2
prompt_version: v1
limits:
  request_limit: 3
  tool_calls_limit: 0
  total_tokens_limit: 20000
  cost_limit_usd: 0.05
  timeout_s: 45
retries_on_validation_error: 2
```

### 5.2 Gateway de modelos (R5 y R6)

Verificado contra la documentación de PydanticAI (OpenRouter) y de OpenRouter (selección de proveedores) a noviembre de 2026. Confirma nombres en tu versión instalada.

```python
# agents/_base/llm_gateway.py
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider

from app.settings import settings  # OPENROUTER_API_KEY desde variables de entorno

# R5: solo endpoints con retención cero, sin recolección de datos,
# y solo proveedores que soporten todos los parámetros (salida estructurada).
_PROVIDER_PRIVACY = {
    "zdr": True,
    "data_collection": "deny",
    "require_parameters": True,
}

def build_model(model_id: str) -> OpenRouterModel:
    return OpenRouterModel(
        model_id,
        provider=OpenRouterProvider(
            api_key=settings.OPENROUTER_API_KEY,
            app_url=settings.APP_URL,
            app_title="NutriNet",
        ),
    )

def build_settings(temperature: float) -> OpenRouterModelSettings:
    return OpenRouterModelSettings(
        temperature=temperature,
        extra_body={"provider": _PROVIDER_PRIVACY},
    )
```

Además, en el panel de OpenRouter activa **ZDR a nivel de cuenta** como segunda barrera. Según la documentación de OpenRouter, los endpoints con "Safety Retention" pueden conservar contenido marcado, y algunos modelos de Google en Vertex lo requieren: **no uses endpoints que no sean ZDR estrictos** para datos de salud. No uses plugins ni herramientas web de OpenRouter: no están cubiertos por ZDR.

### 5.3 Runner común (R7, R8, R3)

```python
# agents/_base/runner.py  (esqueleto; ajusta a tu versión de PydanticAI)
import asyncio, time
from pydantic_ai import UsageLimits
from pydantic_ai.exceptions import UsageLimitExceeded  # verifica el nombre en tu versión

async def run_agent(spec, user_prompt: str, deps, *, trace_ctx) -> "AgentResult":
    agent = spec.build_agent()          # usa llm_gateway, nunca un ID literal
    limits = UsageLimits(
        request_limit=spec.limits.request_limit,
        tool_calls_limit=spec.limits.tool_calls_limit,
        total_tokens_limit=spec.limits.total_tokens_limit,
    )
    last_error = None
    for attempt in range(spec.retries_on_validation_error + 1):
        t0 = time.perf_counter()
        try:
            result = await asyncio.wait_for(
                agent.run(user_prompt, deps=deps, usage_limits=limits),
                timeout=spec.limits.timeout_s,
            )
            errors = spec.validate(result.output, deps)        # R8
            await log_agent_run(spec, deps, result, errors, attempt,
                                latency_ms=(time.perf_counter() - t0) * 1000,
                                trace_ctx=trace_ctx)            # R3
            if not errors:
                return AgentResult(output=result.output, run_id=..., ok=True)
            user_prompt = spec.repair_prompt(user_prompt, errors)
            last_error = errors
        except (UsageLimitExceeded, asyncio.TimeoutError) as exc:
            await log_failed_run(spec, deps, exc, attempt, trace_ctx=trace_ctx)
            last_error = exc
    return AgentResult(output=None, ok=False, error=last_error)  # el workflow decide el plan B
```

`log_agent_run` guarda: agente, modelo usado, versión de prompt, versión de la base de alimentos, **el payload exacto enviado al LLM** (ya pseudonimizado), la salida, tokens, costo, latencia, intento y errores de validación. Ese payload es el que muestra el panel "Qué vio la IA" de la demo.

Para el costo: usa el uso que reporta PydanticAI (`result.usage`, con su campo `cost` estimado) y contrástalo con el costo que reporta OpenRouter. Guarda ambos; el número que se dice al jurado es el de OpenRouter.

---

## 6. Modelo de datos mínimo

| Tabla               | Campos clave                                                                                                                                                          | Notas                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tenant`            | id, tipo (`demo` / `nutritionist` / `clinic`)                                                                                                                         | En la demo, un tenant por sesión.                                                                     |
| `demo_session`      | id, created_at, source (feria, instagram, universidad), expires_at                                                                                                    | Se borra al expirar.                                                                                  |
| `patient`           | id, tenant_id, alias, sexo, edad, peso, talla, actividad, patologías[], alergias[], restricciones[], preferencias[], región, meta                                     | Sin nombre real ni RUT en la demo. En fase 2 los identificadores van en una tabla separada y cifrada. |
| `food_base_version` | id, fuente, fecha, notas, checksum                                                                                                                                    | Versión de la tabla de intercambios.                                                                  |
| `food`              | id, base_version_id, nombre, grupo, porción (medida casera y gramos), aporte por porción, alérgenos[], regiones[], sección de supermercado                            | Los valores vienen de la tabla oficial cargada por el equipo, nunca de un LLM.                        |
| `meal_plan`         | id, tenant_id, patient_id, status (`draft` / `approved` / `archived`), targets (json), exchange_plan (json), base_version_id, approved_by, approved_at                |                                                                                                       |
| `meal_slot`         | id, meal_plan_id, comida (desayuno, colación, almuerzo, once, cena), grupo, porciones                                                                                 | Cupos calculados por código.                                                                          |
| `meal_item`         | id, slot_id, food_id, porciones, source (`ai` / `human`), agent_run_id, trace (json)                                                                                  |                                                                                                       |
| `plan_edit`         | id, meal_plan_id, actor, tipo, antes (json), después (json), created_at                                                                                               | Historial visible ("la IA propuso… la nutricionista cambió…").                                        |
| `agent_run`         | id, agent, modelo, prompt_version, base_version_id, payload_llm (json), output (json), tokens_in, tokens_out, costo, latencia_ms, intento, errores (json), created_at | Nunca contiene datos identificables (R4).                                                             |
| `analytics_event`   | id, demo_session_id, nombre, props (json), created_at                                                                                                                 | Eventos de la sección 12.                                                                             |
| `lead`              | id, nombre, correo, región, tipo de práctica, pacientes/mes, herramienta actual, precio "caro", consentimiento (bool + texto + fecha)                                 | Son datos personales reales: guárdalos aparte y solo con consentimiento explícito.                    |

---

## 7. Motor nutricional determinista (`core/nutrition`)

Este módulo es el corazón técnico y el argumento central ante el jurado. Debe tener pruebas unitarias exhaustivas.

### 7.1 Pipeline de cálculo

1. **Gasto energético:** fórmulas de uso clínico, seleccionables por la nutricionista. Ejemplo: Mifflin-St Jeor (hombres: 10 × peso kg + 6,25 × talla cm − 5 × edad + 5; mujeres: igual, pero − 161), multiplicado por un factor de actividad. Implementa las demás fórmulas (Harris-Benedict, FAO/OMS) **solo con la fuente y coeficientes entregados y validados por la asesora clínica** (`TODO(clinica)` si no están).
2. **Metas:** kcal objetivo (la nutricionista puede sobrescribirla) y distribución de macronutrientes en %, editable.
3. **Cupos de porciones por grupo (`exchange_plan.py`):** cuántas porciones de cada grupo del sistema de intercambio (cereales, verduras, frutas, lácteos, carnes, aceites, etc., según la tabla cargada) cumplen las metas. Es un problema de optimización pequeño: porciones en pasos de 0,5, mínimos y máximos por grupo (definidos por la asesora), minimizando la desviación de kcal y macronutrientes. Usa `scipy.optimize.milp` o una búsqueda acotada; es lo bastante pequeño para resolverse en milisegundos.
4. **Distribución por comida (`distribution.py`):** reparto de los cupos entre desayuno, colación, almuerzo, once y cena con una plantilla por defecto editable.
5. **Cuadre (`balance.py`):** totales y desviación porcentual contra las metas, por nutriente y por comida.

**Consecuencia clave:** como todos los alimentos de un mismo grupo son equivalentes por definición, cuando la IA llena un cupo con cualquier alimento válido de ese grupo, **la pauta queda cuadrada por construcción**. El LLM elige qué comer, no cuánto.

### 7.2 Trazabilidad (`core/trace`)

Cada `meal_item.trace` contiene, como mínimo:

```json
{
  "food_id": "...",
  "food_name": "...",
  "group": "cereales",
  "portions": 1.0,
  "portion_definition": {
    "household": "...",
    "grams": 0,
    "source": "tabla de intercambio vX"
  },
  "contribution": { "kcal": 0, "protein_g": 0, "fat_g": 0, "carbs_g": 0 },
  "slot": { "meal": "desayuno", "group": "cereales", "portions": 1.0 },
  "targets_ref": {
    "formula": "mifflin_st_jeor",
    "inputs": ["peso", "talla", "edad", "sexo", "actividad"]
  },
  "source": "ai",
  "agent_run_id": "...",
  "base_version_id": "..."
}
```

(Los ceros son marcadores de forma: los valores reales los calcula el motor a partir de la tabla.)

---

## 8. Agentes del MVP

### 8.1 `meal_plan_agent`: elegir alimentos para los cupos

- **Una frase:** dado un conjunto de cupos (comida, grupo, porciones) y una lista de alimentos candidatos, elige qué alimento llena cada cupo según las preferencias, la región y la cocina del paciente.
- **Herramientas:** ninguna. Es una sola llamada con salida estructurada (un paso de workflow, no un agente autónomo).
- **Entrada (construida por código):** cupos; candidatos por grupo **ya filtrados** por alérgenos, patologías y restricciones (con alias corto, nombre y grupo; sin valores nutricionales, que no los necesita); preferencias ("cocina poco", "presupuesto bajo"); región; instrucción libre de la nutricionista.
- **Salida:**

```python
from typing import Literal
from pydantic import BaseModel, Field

Meal = Literal["desayuno", "colacion_am", "almuerzo", "once", "cena", "colacion_pm"]

class SlotChoice(BaseModel):
    slot_id: str
    food_ids: list[str] = Field(min_length=1, max_length=2)  # puede dividir un cupo en 2 alimentos
    split: list[float] | None = None  # porciones por alimento si divide; debe sumar el cupo

class MealPlanChoice(BaseModel):
    choices: list[SlotChoice]
    note_for_nutritionist: str = Field(max_length=300)  # breve, sin cifras clínicas
```

- **Validador:** cada `food_id` existe, pertenece al grupo del cupo y estaba en los candidatos; ningún alérgeno; `split` suma el cupo en pasos de 0,5; todos los cupos están llenos; la nota no contiene cifras clínicas.
- **Plan B (si falla tras los reintentos):** llenado determinista con el alimento más frecuente de cada grupo para esa comida. La demo nunca debe quedarse sin pauta.

### 8.2 `refine_agent`: pedidos en lenguaje natural

- **Una frase:** traduce pedidos como "baja 200 kcal", "cena sin cocinar" o "más proteína en el desayuno" en operaciones sobre la pauta, usando herramientas deterministas.
- **Herramientas (máximo 5):**
  - `get_plan_summary()`: cupos y alimentos actuales.
  - `swap_food(slot_id, new_food_id)`: cambia un alimento por otro del mismo grupo (el código valida).
  - `find_options(slot_id, criteria)`: candidatos válidos del grupo que cumplen un criterio ("sin cocción", "económico").
  - `adjust_targets(delta_kcal | macro_split)`: recalcula metas y cupos con el motor (el número lo aplica el código).
  - `move_portion(from_slot, to_slot)`: mueve porciones del mismo grupo entre comidas.
- **Salida:** `RefineResult(operations_applied: list[str], summary: str)`.
- **Límites:** 6 solicitudes y 8 llamadas a herramientas como máximo.
- **Después:** si cambian los cupos, el workflow vuelve a llamar a `meal_plan_agent` solo para los cupos afectados.

### 8.3 `recipes_agent`: redactar preparaciones

- **Una frase:** escribe una preparación simple para cada comida usando solo los alimentos de esa comida.
- **Entrada:** alimentos y gramos por comida (calculados por el código), preferencias y región.
- **Salida:** `Recipe(meal, title, steps: list[str], uses_food_ids: list[str], optional_seasonings: list[str])`.
- **Validador:** `uses_food_ids` ⊆ alimentos de esa comida; los condimentos salen de una lista permitida (ojo con la sal en pacientes hipertensos: la lista depende de las patologías); los pasos no contienen cantidades nuevas. Las cantidades que ve el usuario las inserta el código desde la pauta.

### 8.4 Lista de compras: no es un agente

`workflows/shopping_list.py` suma gramos por alimento para N días, los convierte a unidades de compra con una tabla de equivalencias y los agrupa por sección del supermercado. Es código puro: rápido, gratis y exacto.

---

## 9. Workflows (nivel 0)

### 9.1 `generate_meal_plan`

```
1. load_patient()              → valida ficha completa
2. compute_targets()           → core/nutrition (emite "Calculando requerimientos ✓")
3. build_exchange_plan()       → cupos por grupo (emite "Armando porciones ✓")
4. distribute_by_meal()        → cupos por comida
5. select_candidates()         → filtros de alérgenos, patologías, región (emite "Revisando alergias ✓")
6. build_llm_payload()         → lista blanca R4; se guarda para "Qué vio la IA"
7. run_agent(meal_plan_agent)  → con validación y reintentos (emite "Eligiendo alimentos ✓")
8. fallback_fill() si falla    → llenado determinista
9. compute_balance()           → cuadre final (emite "Cuadrando metas ✓")
10. build_traces()             → trazas por ítem
11. persist(draft)             → status="draft"
12. run_agent(recipes_agent)   → en paralelo o al aprobar
```

Los mensajes con ✓ se envían al frontend por **Server-Sent Events** (`GET /meal-plans/{id}/progress`). Son los pasos que el jurado ve en pantalla en la demo.

**Meta de rendimiento:** borrador completo en menos de 60 segundos (p95), idealmente menos de 20.

### 9.2 `approve_meal_plan`

Valida que la pauta esté cuadrada dentro de la tolerancia (o que la nutricionista acepte explícitamente la desviación), registra `approved_by` y `approved_at`, crea un `PlanEdit` de aprobación, genera el PDF y publica en el portal. Es el **único** camino hacia el paciente (R2).

---

## 10. Seguridad y datos de salud

| Tema                                                 | Demo (ahora)                         | Piloto con pacientes reales (fase 2)                                                                                          |
| ---------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Datos de pacientes                                   | Solo ficticios (R9)                  | Consentimiento explícito registrado (texto, versión, fecha) antes de crear la ficha                                           |
| Payload al LLM                                       | Lista blanca (R4)                    | Igual, más pruebas automáticas que buscan patrones de RUT, correo y teléfono en el payload                                    |
| Proveedor de IA                                      | ZDR + `data_collection: deny` (R5)   | Igual, más revisión periódica de qué endpoints usa OpenRouter                                                                 |
| Cifrado                                              | HTTPS                                | HTTPS + cifrado en reposo; identificadores en tabla separada                                                                  |
| Acceso                                               | Sesión de demo                       | Autenticación con segundo factor; roles en clínicas; registro de accesos a fichas                                             |
| Aislamiento                                          | Filtro por `demo_session_id`         | Filtro por `tenant_id` + Row Level Security en PostgreSQL                                                                     |
| Registro                                             | `agent_run` sin datos identificables | Igual, con retención definida                                                                                                 |
| Respaldo                                             | No necesario (datos efímeros)        | Diario, con prueba de restauración                                                                                            |
| Incidentes                                           | —                                    | Protocolo escrito de respuesta y aviso                                                                                        |
| Ley 21.719 (vigente desde el 1 de diciembre de 2026) | —                                    | Revisión legal antes del piloto: consentimiento, derechos de los titulares, contratos de encargo, transferencia internacional |

**Entrada de texto libre:** la instrucción que escribe la nutricionista se trata como no confiable. Nunca se ejecuta y la salida del agente siempre pasa por el validador. El paciente no le escribe a ningún agente.

---

## 11. Especificaciones de la demo (sin login)

- **Entrada:** pantalla con "NutriNet · Plataforma clínica para nutricionistas" y el botón "Probar el reto de 5 minutos". Crea una `demo_session` (cookie) y un tenant de demo.
- **Pacientes precargados** (`demo/seed_patients.py`): Valentina (34, Antofagasta, resistencia a la insulina, sin lácteos, cocina poco), Don Luis (62, Chiloé, diabetes tipo 2 e hipertensión), Martín (19, Santiago, deportista). Validados por la asesora antes de publicar.
- **Banner fijo:** "Demo con datos ficticios. No ingreses datos reales de pacientes."
- **Cronómetro:** inicia en "empezar reto" y se detiene en "aprobar"; se guarda como evento.
- **Funciones visibles (P1):** ficha express, asistente de pauta con pasos en vivo, clic en cifra → trazabilidad, pestaña Historial, cuadre en vivo con semáforo, intercambio con un clic, bloqueo de alérgenos con motivo, aprobar y firmar → PDF, vista del portal en celular, panel "Qué vio la IA", selector de región, formulario de socia fundadora.
- **Reinicio:** las sesiones de demo expiran a las 24 horas y sus datos se borran (salvo `analytics_event` y `lead`).
- **Selector de región:** en la demo, una curaduría pequeña de alimentos con etiqueta de región que reordena los candidatos. Muéstralo como "versión preliminar".

---

## 12. Analítica para validar el MVP

Eventos (tabla `analytics_event`, con `demo_session_id` y `source`):

`demo_started`, `patient_selected`, `chart_completed`, `plan_generation_started`, `plan_generated` (con segundos y costo), `plan_item_swapped`, `refine_requested`, `trace_opened`, `history_opened`, `allergen_block_shown`, `llm_payload_viewed`, `region_changed`, `plan_approved` (con tiempo total del reto), `pdf_downloaded`, `portal_opened`, `survey_submitted`, `lead_submitted`.

Con eso salen las métricas del pitch: pruebas completas, tiempo por pauta, desviación calórica, cifras corregidas, facilidad de uso, costo real por pauta y conversión a socia fundadora.

---

## 13. Evals: cómo elegir modelo y evitar regresiones

Cada agente tiene casos en `agents/<agente>/evals/cases/*.yaml`, validados por la asesora clínica.

```yaml
id: valentina_base
patient:
  {
    sexo: F,
    edad: 34,
    peso: 82,
    talla: 163,
    actividad: sedentaria,
    patologias: [resistencia_insulina],
    alergias: [lactosa],
    preferencias: [cocina_poco],
    region: antofagasta,
  }
instruction: "Pauta para bajar de peso, cocina poco"
must:
  - no_allergen_violations
  - all_slots_filled
  - foods_from_candidates_only
  - valid_schema
should:
  - region_foods_ratio >= 0.3
  - repeated_food_max <= 2
```

**Puertas duras** (si una falla, el modelo o prompt se rechaza): cero violaciones de alérgenos, 100% de esquemas válidos, 100% de alimentos dentro de los candidatos, cupos completos.
**Métricas de comparación:** cuadre final (debería quedar dentro de la tolerancia por construcción), tasa de aprobación sin cambios en pruebas con nutricionistas, latencia p95 y costo por pauta.

`python -m evals.run --agent meal_plan --models <id1>,<id2>,<id3>` produce una tabla comparativa. **Elige el modelo más barato que pase todas las puertas duras con la latencia objetivo.** Repite las evals en cada cambio de prompt, de modelo o de base de alimentos.

Pruebas unitarias obligatorias además de las evals: fórmulas de energía contra valores calculados a mano, solver de cupos, validadores (con salidas maliciosas o malformadas), `build_llm_payload` (no debe filtrar campos fuera de la lista blanca) y que `approve` sea el único camino al portal.

---

## 14. API mínima

| Método y ruta                                    | Uso                                             |
| ------------------------------------------------ | ----------------------------------------------- |
| `POST /demo/sessions`                            | Crea sesión de demo y carga pacientes ficticios |
| `GET /patients` · `GET/PUT /patients/{id}`       | Ficha                                           |
| `POST /patients/{id}/targets/preview`            | Requerimientos y cupos sin generar pauta        |
| `POST /meal-plans`                               | Lanza `generate_meal_plan`                      |
| `GET /meal-plans/{id}/progress`                  | SSE con los pasos                               |
| `GET /meal-plans/{id}`                           | Pauta con cuadre y trazas                       |
| `POST /meal-plans/{id}/refine`                   | Pedido en lenguaje natural                      |
| `POST /meal-plans/{id}/items/{item}/swap`        | Intercambio con un clic                         |
| `GET /meal-plans/{id}/history`                   | Historial (`plan_edit` + `agent_run`)           |
| `GET /meal-plans/{id}/llm-payload`               | "Qué vio la IA"                                 |
| `POST /meal-plans/{id}/approve`                  | Aprobación y PDF                                |
| `GET /meal-plans/{id}/shopping-list`             | Lista de compras                                |
| `GET /portal/{token}`                            | Vista del paciente (solo pautas aprobadas)      |
| `POST /events` · `POST /surveys` · `POST /leads` | Analítica, encuesta y socias fundadoras         |

---

## 15. Plan de construcción por fases

### Fase demo (4 al 13 de noviembre): lo mínimo que gana

Orden estricto; cada paso con su "listo cuando":

1. **Base de alimentos versionada** cargada desde la tabla oficial que entregue el equipo. Listo cuando: cada alimento tiene grupo, porción y aporte, con la fuente registrada.
2. **Motor nutricional** (sección 7) con pruebas. Listo cuando: los 3 pacientes ficticios dan requerimientos y cupos que la asesora aprueba.
3. **`llm_gateway` + runner + `agent_run`**. Listo cuando: una llamada de prueba queda registrada con payload, costo y latencia, y el tráfico va con ZDR.
4. **`meal_plan_agent` + validador + plan B + trazas**. Listo cuando: los 3 casos de eval pasan las puertas duras con al menos 2 modelos.
5. **Workflow con SSE + UI de pasos**, clic en cifra, Historial y cuadre en vivo.
6. **Intercambio con un clic y bloqueo de alérgenos.**
7. **Aprobar → PDF + vista de portal.**
8. **Analítica, encuesta, formulario de socia fundadora, banner, cronómetro.**
9. **`refine_agent`** con 3 pedidos sugeridos que funcionen siempre.
10. **"Qué vio la IA" y selector de región** (curaduría pequeña).
11. **`recipes_agent`** (si el tiempo no alcanza, recetas precargadas para los 3 pacientes).

**No construir en esta fase:** login, multi-tenant real, agenda, boletas, pagos, match, chat con pacientes, bot de WhatsApp, ejecución durable, MCP, A2A, copiloto.

### Fase 2: piloto con pacientes reales

Autenticación y tenants reales, consentimiento y revisión legal (Ley 21.719), cifrado de identificadores, Row Level Security, respaldo y protocolo de incidentes, importación desde Excel, alertas de adherencia por reglas, `chart_summary_agent`, plantillas reutilizables y más fórmulas y poblaciones validadas.

### Fase 3: escala nacional

`copilot_agent` (router conversacional con delegación a especialistas), ejecución durable para flujos largos, canasta regional con precios, integración por estándares de interoperabilidad clínica y, cuando se justifique, exposición de herramientas vía MCP para integraciones con clínicas.

---

## 16. Cómo agregar un agente nuevo (por ejemplo, "agente de educación al paciente")

1. Escribe su descripción en **una frase**. Si necesitas "y además", son dos agentes.
2. Decide su tipo con la regla de la sección 3.3: ¿código, paso de LLM o agente con herramientas?
3. Crea la carpeta con los 6 elementos del contrato (sección 5).
4. Define un `Output` sin cifras clínicas libres y su validador.
5. Escribe al menos 5 casos de eval con la asesora.
6. Corre las evals con 2 o 3 modelos y elige por puertas duras, costo y latencia.
7. Regístralo en `registry.py` y llámalo **solo desde un workflow** (nivel 0), nunca directamente desde el frontend.
8. Agrega sus eventos de analítica.

---

## 17. Antipatrones prohibidos

- Pedirle al LLM que "calcule la dieta" o que devuelva kcal o gramos.
- Instanciar un modelo o escribir un ID de modelo fuera de `llm_gateway.py` y `config.yaml`.
- Enviar al LLM el objeto `Patient` completo o texto libre del paciente.
- Un "agente supervisor" con LLM para el flujo principal de pauta.
- Agentes que se llaman entre sí sin límites ni registro.
- Guardar datos clínicos en la "memoria" de un agente.
- Publicar en el portal una pauta sin aprobar.
- Editar un prompt publicado en vez de crear una versión nueva.
- Cambiar de modelo sin correr evals.
- Mostrar en la demo una función que no funciona de verdad.

---

## 18. Preguntas abiertas que el equipo debe responder (no las supongas)

1. ¿Cuál es el archivo oficial de la tabla de porciones de intercambio que se usará, y con qué permiso de uso?
2. ¿Qué fórmulas de gasto energético, factores de actividad y rangos mínimos y máximos por grupo aprueba la asesora?
3. ¿Qué plantilla de distribución por comida usamos por defecto?
4. ¿Qué frontend, hosting y base de datos usa hoy el repositorio?
5. ¿Qué modelos de OpenRouter probamos primero (al menos uno económico y uno de gama media)?
6. ¿Qué alimentos forman la curaduría regional de la demo para Antofagasta, Santiago y Chiloé?
7. ¿Quién revisa las recetas y la lista de condimentos permitidos por patología?
