---
name: nestjs-module
description: Guía práctica para crear un módulo en la arquitectura NestJS de la aplicación (Modular Monolith).
---
# NestJS Modular Monolith Playbook

Use this playbook when creating, refactoring, or extending backend modules, controllers, services, and DTOs.

## Module Structure
Each module should reside under `backend/src/modules/<module-name>/` and contain:
1. `<module-name>.module.ts`: Root module declaration importing controllers and providers.
2. `<module-name>.controller.ts`: API endpoints with Swagger decorations (`@ApiTags`, `@ApiOperation`), security guards (`@UseGuards`), and DTO bindings.
3. `<module-name>.service.ts`: Business logic and database access using Prisma.
4. `dto/`: Input validation transfer objects.
   - `create-<module-name>.dto.ts`
   - `update-<module-name>.dto.ts`
5. `entities/` or types (optional).

## Code Style & Conventions
- **Validation**: Decorate DTO properties with `class-validator` (e.g. `@IsString()`, `@IsNotEmpty()`, `@IsEmail()`).
- **Dependency Injection**: Use constructor injection for services and prisma clients.
- **Error Handling**: Throw NestJS HTTP exceptions (e.g. `NotFoundException`, `BadRequestException`, `ForbiddenException`). Never throw raw generic errors to the client.
- **Prisma Client**: Inject `PrismaService` for database queries. Always narrow selection via `select` to avoid fetching unnecessary fields.
