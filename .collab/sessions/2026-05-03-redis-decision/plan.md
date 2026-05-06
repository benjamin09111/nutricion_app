# Plan: Redis Decision Formalization

**Date:** 2026-05-03
**Mode:** ADAPTIVE

## Goal
Document the Redis strategy for NutriNet: what it would be used for, where it's NOT needed, and current decision to keep in-memory cache.

## Scope

### In Scope
- Document current Redis setup state (installed but inactive)
- Define when Redis adds value (BullMQ, multi-instance, pattern invalidation)
- Explicitly state that "vista paciente compartida" does NOT need Redis
- Record the decision to stay on in-memory cache for now
- Update `.agent/roadmap.md` if needed

### Out of Scope
- Actually wiring Redis in app.module.ts
- Installing or configuring Redis/Upstash
- Any code changes

## Research (completed)
- Redis v5.11.0 installed, `cache-manager-redis-yet` installed
- `redisStore` imported but not used in `CacheModule.register()`
- `.env` has REDIS_URL pointing to Upstash (serverless Redis)
- Current cache: in-memory (default NestJS behavior)
- `CacheService` has Redis-optimized pattern invalidation (unused)
- `HttpCacheInterceptor` excludes `/foods` from caching
- Decision from conversation: stay on in-memory for now

## Files to create/modify
1. `.agent/decisions/redis-strategy.md` — Decision record (NEW)
2. `.agent/roadmap.md` — Optional: add note if missing

## Implementation Steps
1. Create `.agent/decisions/` directory if not exists
2. Write `redis-strategy.md` covering:
   - Current state
   - When Redis adds value
   - When Redis is NOT needed (shared patient view)
   - Decision
3. Present for review (Ship Gate)

## Verification
- Read the document, verify it's clear and accurate
- No code changes needed
