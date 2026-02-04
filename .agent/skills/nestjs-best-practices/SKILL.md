---
name: nestjs-best-practices
description: Comprehensive guide for NestJS best practices, optimization, scaling, and maintainability. Use this skill when the user asks for NestJS coding standards, architectural advice, refactoring for performance, or "clean code" in a NestJS project.
---

# NestJS Best Practices & Optimization

This skill outlines the standards for creating scalable, manageable, and high-performance NestJS applications.

## 1. Architecture & Structure

### Modularization (Scalability & Manageability)
- **Feature Modules**: Organize code by domain feature (e.g., `UsersModule`, `AuthModule`, `OrdersModule`), not by technical layer (controllers, services).
- **Shared Module**: Create a `SharedModule` for reusable services/components (e.g., utility helpers) that don't depend on other modules.
- **Core Module**: Create a `CoreModule` for global singleton services (e.g., Interceptors, Filters, global pipes, Database connection config) that are imported only once in `AppModule`.
- **Circular Dependencies**: AVOID them. If you have them, your boundaries are wrong. Use `forwardRef` only as a last resort.

### Directory Structure
```
src/
├── common/             # Global generic code (filters, guards, interceptors, pipes, decorators)
├── config/             # Configuration files (validations, env loaders)
├── modules/            # Domain modules
│   ├── users/
│   │   ├── dto/        # Data Transfer Objects
│   │   ├── entities/   # Database Entities
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
├── main.ts
└── app.module.ts
```

## 2. Strong Typing & Validation (Readability & Reliability)

### DTOs (Data Transfer Objects)
- **Always use DTOs** for Controller inputs.
- **Validation**: Use `class-validator` and `class-transformer`.
- **Strict Whitelisting**: Enable `whitelist: true` in global validation pipe to strip unexpected properties.

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true, // Automatically transform payloads to DTO instances
}));
```

### Config Validation for Environment Variables
- Do not use `process.env` directly in services.
- Use `@nestjs/config` with a validation schema (Joi or class-validator) to ensure the app fails fast if env vars are missing.

## 3. Performance & Optimization

### Database Interaction
- **Projections**: Always select only the fields you need. Avoid `SELECT *`.
- **N+1 Problem**: Use `relations` carefully or use QueryBuilder/DataLoaders.
- **Indexes**: Ensure database columns used in `WHERE`, `ORDER BY`, and `JOIN` are indexed.

### Caching
- Use `@nestjs/cache-manager` for expensive operations.
- Cache at the service level (method usage) or controller level (routes).

### Compression
- Enable Gzip compression in `main.ts`:
  ```typescript
  import * as compression from 'compression';
  app.use(compression());
  ```

## 4. Exception Handling (Clean Code)

- **Global Filters**: Use detailed Global Exception Filters to normalize error responses.
- **Custom Exceptions**: Create domain-specific exceptions extending `HttpException`.
- **Avoid Try-Catch in Controllers**: Let the global filter handle standard errors, or catch in Service and re-throw a structured NestJS exception.

## 5. Security Practices

- **Helmet**: Use `helmet` middleware for setting security headers.
- **Rate Limiting**: Use `@nestjs/throttler` to prevent abuse.
- **CORS**: Configure CORS strictly; do not leave it open (`*`) in production.

## 6. Testing (Manageability)

- **Unit Tests**: Test Services in isolation by mocking Repositories/dependencies.
- **E2E Tests**: Test Controllers and the full flow using Supertest.
- **Atomic Tests**: Each test should verify a single behavior.

## 7. Readability Rules

- **Method Length**: Methods should be short and focused (Single Responsibility Principle).
- **Naming**:
  - `findAllUsers()` vs `get()`  (Descriptive)
  - `UserDto` vs `User` (Suffixes for type clarification)
- **Comments**: Comment *why*, not *what*. Code should be self-documenting.
