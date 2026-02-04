---
name: bullmq-redis-optimization
description: Best practices for implementing asynchronous background jobs, message queues, and caching using BullMQ and Redis in NestJS applications.
---

# BullMQ & Redis Optimization Skill

This skill provides guidelines and patterns for using BullMQ and Redis to optimize NestJS applications. It focuses on offloading heavy tasks, managing concurrency, and ensuring scalability.

## 1. When to Use BullMQ & Redis

Use BullMQ and Redis when you need to:
- **Offload Heavy Processing**: Move CPU-intensive tasks (e.g., PDF generation, image processing, complex calculations) out of the main request-response cycle.
- **Handle Third-Party API Rate Limits**: Queue requests to external APIs (e.g., email services, payment gateways) to respect their rate limits using BullMQ's rate limiting features.
- **ensure Reliability**: Retry failed jobs automatically and handle intermittent failures gracefully without losing data.
- **Cache Expensive Operations**: Use Redis to cache the results of expensive database queries or computations.

## 2. Architecture & Patterns

### 2.1 Producer-Consumer Pattern
- **Producer**: The API (Controller/Service) that receives the user request and adds a job to the queue. *Response is immediate (202 Accepted).*
- **Consumer (Worker)**: A separate background process or service that picks up jobs from the queue and executes them.

### 2.2 Queue Configuration (NestJS)
Use `@nestjs/bullmq` for seamless integration.

```typescript
// app.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD, // Optional
      },
    }),
    BullModule.registerQueue({
      name: 'pdf-generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true, // Keep Redis clean
      },
    }),
  ],
})
export class AppModule {}
```

### 2.3 Job Processing (Processor)
Define a processor to handle jobs. Ensure exception handling to trigger retries.

```typescript
// pdf.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('pdf-generation')
export class PdfProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    // 1. Validate input
    // 2. Perform heavy task (e.g. generate PDF)
    // 3. Store result (Storage / DB)
    // 4. Return result (optional, for completion events)
  }
}
```

## 3. Optimization Rules (Critical)

1.  **Strict Concurrency Control**: ALWAYS explicitly set concurrency to prevent resource saturation (CPU/RAM).
    ```typescript
    // In main.ts or module setup (depending on how worker is launched)
    // For @nestjs/bullmq, concurrency is often set in the worker options or per-process.
    // Ideally, pass concurrency to the Worker constructor if manually instantiating, 
    // or use suitable NestJS configuration.
    ```
2.  **Separate Workers**: For high-load apps, run Workers in a separate process/container/pod from the API to prevent blocking the HTTP server.
3.  **Redis Persistence**: Ensure Redis has AOF (Append Only File) enabled if job persistence is critical across restarts.
4.  **Job Cleanup**: Always use `removeOnComplete: true` or `removeOnFail: { count: 100 }` to avoid Redis running out of memory with old job data.
5.  **Atomic Operations**: When using Redis for caching or counters, use atomic operations (`INCR`, `SETNX`, Lua scripts) to prevent race conditions.

## 4. Redis Caching Strategy

- **Cache-Aside (Lazy Loading)**:
    1. Check Cache (Redis `GET`).
    2. If Hit: Return data.
    3. If Miss: Fetch from DB, Write to Cache (Redis `SETEX` with TTL), Return data.
- **TTL (Time To Live)**: ALWAYS set an expiration time for cached keys to ensure data freshness and memory cleanup.

## 5. Security & Connections
- **TLS**: Use TLS for Redis connections in production (e.g., Upstash, AWS ElastiCache).
- **Prefixing**: Use prefixes for Redis keys (e.g., `myapp:cache:users:123`) to avoid collisions.

## 6. Implementation Checklist
- [ ] Installed `@nestjs/bullmq` and `bullmq`.
- [ ] Configured Redis connection variables in `.env`.
- [ ] Created Queue(s) in Module.
- [ ] Created Processor(s) with `@Processor`.
- [ ] Implemented error handling and retries.
- [ ] Verified Concurrency settings.
