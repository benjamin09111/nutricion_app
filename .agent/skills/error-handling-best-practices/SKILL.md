---
name: error-handling-best-practices
description: Comprehensive guide for robust error handling, monitoring, and debugging strategies in full-stack applications (Next.js + NestJS + Database).
---

# Error Handling & Obervability Standards

This skill defines the standards for intercepting, classifying, and reporting errors. The goal is to move from "Something went wrong" to "Database Disk Full on Insert Operation".

## 1. The Correct Mindset: Fail Loudly, Fail clearly

- **Never Swallow Errors**: Empty catch blocks (`try { ... } catch (e) {}`) are forbidden.
- **Context is King**: An error without context (inputs, user ID, operation name) is useless.
- **Developer vs User**: 
  - The **Developer** needs the stack trace, the SQL code (P2002), and the input data.
  - The **User** needs a clear, localized message ("No pudimos guardar los cambios").

## 2. Granular Error Classification

Apps usually fail in predictable ways. We must categorize them:

- **Validation Errors (400)**: Zod schema failures, missing fields.
- **Authentication Errors (401/403)**: Token expired, insufficient role.
- **Not Found (404)**: Record does not exist (Prisma `P2025`).
- **Conflict (409)**: Unique constraint violation (Prisma `P2002` - e.g. Email already exists).
- **Infrastructure Errors (500/503)**:
  - `57P03`: Database starting up.
  - `53100`: Disk Full.
  - `08006`: Connection failure.
  - `Timeout`: External API or DB took too long.

## 3. Database Constraints (Prisma & Postgres)

Specific handling for Database limits (Storage, Connections, Timeouts).

```typescript
try {
  await prisma.user.create({ ... });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException('Already exists: ' + error.meta?.target);
      case 'P2025':
        throw new NotFoundException('Record not found');
      // Postgres Error Codes mapping
      default:
         // Look for raw postgres codes if exposed by driver
         if ((error as any).code === '53100') { // Disk Full
            console.error('CRITICAL: DATABASE DISK FULL');
            // Notify Admin System (Email/Slack webhook)
            throw new ServiceUnavailableException('Database capacity reached');
         }
    }
  }
  throw error; // Re-throw unknown errors
}
```

## 4. Frontend Error Boundaries & Toasts

- **Global Boundary**: Next.js `error.tsx` catches crashes in the render tree.
- **API Feedback**:
  - Success: Subtle toast.
  - Error: Durable toast with a strict message.
  - Developer Mode (`NODE_ENV=development`): Show the raw error details in the toast or console.

## 5. Monitoring & Alerting (The "Notification" layer)

How does the app "tell you" something is wrong?

- **Structured Logging**: Use a logger (Pino or Winston) that outputs JSON, not plain text strings.
- **Sentry / Telemetry**: In production, critical errors (500s) must be sent to an external tracker.
- **Health Checks**:
  - Implement a `/health` endpoint that actually queries the DB (`SELECT 1`).
  - If the DB is full (cannot write), the `/health` check should return specific status, causing the load balancer or monitor to alert.

## 6. Implementation Rules

1. **Service Layer**: All business logic must wrap external calls in `try/catch` and map them to Domain Exceptions.
2. **Server Actions**: Must return a standardized `Result<T>` object: `{ success: boolean, data?: T, error?: string, debugInfo?: any }`.
3. **No Magic Strings**: Use constants for error messages or dictionary keys.
