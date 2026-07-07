# Strategic Decision Log

Registro historico de decisiones arquitectonicas mayores para evitar reintroducir patrones descartados.

## 2026-07-06 — Estandarizacion del Agente Desarrollador
- **Decision**: Crear sistema `agents.md` + `memory.md` + `rules/*` para el agente desarrollador.
- **Razon**: El agente necesita identidad clara, memoria persistente y reglas explicitas para no repetir errores. La estructura `.agents/` anterior era solo contexto sin mecanismo de aprendizaje.
- **Impacto**: Toda sesion de desarrollo ahora carga agents.md, memory.md, rules/development.md y rules/design.md como base.

## 2026-07-06 — Arquitectura de IA: AI SDK + ToolLoopAgent
- **Decision**: Migrar de `fetch()` manual a Vercel AI SDK para todas las llamadas a LLMs. Usar `ToolLoopAgent` para el Copiloto Clinico en vez de endpoints independientes.
- **Razon**: El SDK provee tipado fuerte (Zod schemas), streaming nativo, tool calling, y provider fallback. Reemplaza 212+ lineas de codigo manual. El ToolLoopAgent da autonomia real (observe → think → act loop).
- **Impacto**: `AiService` se modifica internamente manteniendo API. Se crea `backend/src/modules/copilot/`.

## 2024-05-07 — Desactivacion de .collab
- **Decision**: Remover el sistema `.collab` (excesivo overhead para solo developer).
- **Razon**: Demasiada ceremonia para un equipo de uno. Reemplazado por framework `.agents/` mas liviano.

## 2024-05-07 — Limpieza de duplicados
- **Decision**: Eliminar archivos duplicados en raiz (DietClient_main.tsx, scratch/).
- **Razon**: Limpieza pre-MVP.

## Pre-2024 — Estrategia de Datos: Relacional + JSONB
- **Decision**: Usar modelo hibrido: columnas relacionales para FK e identidad, JSONB para contenido flexible (Creation.content, Patient.dietRestrictions, Consultation.metrics).
- **Razon**: Permite iteracion rapida sin migraciones frecuentes de schema para datos clinicos variables.

## Pre-2024 — Arquitectura: Monorepo Suelto
- **Decision**: Monorepo sin workspace manager (sin Turborepo, sin npm workspaces). `frontend/` y `backend/` como proyectos independientes.
- **Razon**: Simplicidad operativa para equipo pequeno. Cada proyecto tiene su propio package.json, scripts y dependencias.

## Pre-2024 — NestJS como Modular Monolith
- **Decision**: NestJS con arquitectura de modulos por dominio. Sin microservicios.
- **Razon**: Complejidad de microservicios no justificada para el alcance actual. La separacion por modulos da suficiente aislamiento.

## Pre-2024 — DeepSeek como Proveedor Primario de IA
- **Decision**: Usar DeepSeek (deepseek-v4-flash) como provider principal, OpenAI (gpt-4o-mini) como fallback.
- **Razon**: Costo y latencia. DeepSeek es suficiente para la mayoria de tareas clinicas. OpenAI como backup de calidad.
