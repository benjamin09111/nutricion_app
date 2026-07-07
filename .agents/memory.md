# Memoria del Agente Desarrollador

Este archivo es la memoria persistente del agente. Se lee al inicio de cada sesion y se escribe automaticamente cuando el agente aprende algo nuevo.

---

## Correcciones del Usuario
*(El agente escribe aqui automaticamente cuando el usuario corrige algo)*

---

## Preferencias del Usuario

- **Ejecucion secuencial**: prefiere fases completas antes de pasar a la siguiente, no trabajo en paralelo
- **SSE para streaming**: Server-Sent Events sobre WebSocket para el chat del copiloto
- **Reemplazo directo**: modificar codigo existente en vez de crear nuevas abstracciones en paralelo
- **Escritura automatica en memory.md**: el agente escribe sin pedir permiso. Para otros archivos (.agents/rules/, patterns.md, etc.) pregunta primero
- **Alcance total de .agents/**: el agente puede usar todo el contenido de .agents/ incluyendo skills/
- **Contenido inicial pragmatico**: prefiere empezar con anti-patrones genericos y luego refinar con experiencia real
- **Interes principal**: que el agente no olvide correcciones ni errores. memory.md es la prioridad #1
- **Nombre del agente**: "Antigravity"

---

## Errores Cometidos (NO repetir)
*(Fallos y patrones que el agente debe evitar en el futuro)*

---

## Decisiones de Arquitectura

### 2026-07-06 — Sistema de Agentes Dual
- Dos tracks independientes: Track A (agente desarrollador, .agents/) y Track B (Copiloto Clinico, producto)
- Track A completado: agents.md + memory.md + rules/development.md + rules/design.md + feedback.md + evolution/* + entrypoint.md + map/files.md
- Pendiente: Track B (AI SDK + ToolLoopAgent + frontend chat)
- agent-rules.md marcado como DEPRECATED, absorbido por agents.md
