# Redis Strategy Decision

**Date:** 2026-05-03
**Status:** Decided (in-memory cache active, Redis available but not wired)

## Current State

```
backend/
├── src/app.module.ts
│   ├── import { redisStore } from 'cache-manager-redis-yet'   ← imported
│   └── CacheModule.register({ ttl: 300 })                     ← NOT using redisStore
│                                                                 defaults to in-memory
├── .env
│   ├── REDIS_URL=rediss://...upstash.io:6379                  ← configured
│   └── REDIS_PASSWORD=...                                     ← valid credentials
└── package.json
    ├── cache-manager-redis-yet                                 ← installed
    └── redis@5.11.0                                            ← installed
```

Redis packages are installed and env vars are configured, but `CacheModule.register()` in `app.module.ts` does not pass a `store` option. NestJS defaults to in-memory cache. The `redisStore` import on line 20 is unused.

## When Redis Adds Value

Redis should be activated when any of these conditions are met:

| Condition | Why |
|-----------|-----|
| **BullMQ job queue** | BullMQ requires Redis. Needed for background jobs (PDF generation, AI processing, price scraping). |
| **Multiple backend instances** | In-memory cache is per-process. With >1 instance, Redis is needed for cache coherence. |
| **Pattern-based invalidation** | `CacheService` has `invalidateNutritionistPrefix()` and `invalidatePattern()` designed for Redis key scanning. Currently falls back to full cache wipe. |
| **Session persistence** | Redis persists across restarts. In-memory is lost on every deploy. |

## When Redis Is NOT Needed

| Scenario | Why |
|----------|-----|
| **Shared patient view** (`/dashboard/pacientes/compartir`) | Read-only view, low traffic, no cache writes. In-memory cache is sufficient. |
| **Single-instance deployment** | Current state. One NestJS process, one cache. |
| **Low-traffic GET endpoints** | Most backend endpoints serve <100 req/min. In-memory TTL of 300s is plenty. |

## Decision

**Stay on in-memory cache.** Do not wire Redis at this time.

Rationale:
- Single-instance deployment (no multi-instance cache coherence needed)
- No BullMQ jobs active yet
- In-memory cache has lower latency (~0.1ms vs ~5-15ms for Upstash)
- Zero external dependency = simpler ops

When Redis becomes necessary (BullMQ, multi-instance, or pattern invalidation is critical):
1. Pass `redisStore` to `CacheModule.register()` in `app.module.ts`
2. Remove the `@Optional()` decorator in `CacheService` (make Redis required)
3. The `.env` variables (`REDIS_URL`, `REDIS_PASSWORD`) are already configured and valid

## Related Files

- `backend/src/app.module.ts:52` — CacheModule.register() (where to add store)
- `backend/src/common/services/cache.service.ts` — CacheService (pattern invalidation ready)
- `backend/src/common/interceptors/http-cache.interceptor.ts` — GET caching with user-scoped keys
