# Changelog: Redis Decision Formalization

**Completed:** 2026-05-03
**Author:** Agent + Developer (ADAPTIVE mode)
**Branch:** feat/collab-workflow-redis

## What Was Done
Documented Redis strategy: stay on in-memory cache for now. Decision record in `.agent/decisions/redis-strategy.md`.

## Key Decisions
- Redis codificado como "disponible pero no conectado" — paquetes instalados, env vars listos
- No se implementa hasta que haya BullMQ, multi-instancia, o invalidación por patrones
- "Vista paciente compartida" explícitamente NO necesita Redis

## Files Created
- `.agent/decisions/redis-strategy.md` — Decision record
- `.collab/sessions/2026-05-03-redis-decision/plan.md` — Session artifact
- `.collab/sessions/2026-05-03-redis-decision/walkthrough.md` — Session artifact

## Files Modified
- `.collab/active.md` — Session state

## What's Next
- Los files del collaborative system (AGENTS.md, .collab/rules.md, .agent/skills/) están sin commitar en esta branch. Evaluar si commitearlos o dejarlos para otra PR.
