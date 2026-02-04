---
description: Steps to scaffold a new NestJS Module in the Modular Monolith
---

# Workflow: Scaffold New NestJS Module

Use this workflow when creating a NEW domain module (e.g. `nest g module diet`).

## 1. Module Creation
- Run `nest g module modules/<module_name>`
- Run `nest g service modules/<module_name>`
- Run `nest g controller modules/<module_name>`

## 2. DTO Definition
- Create folder `src/modules/<module_name>/dto`
- Create `create-<entity>.dto.ts` and `update-<entity>.dto.ts`
- **Rule**: Use `class-validator` decorators explicitly.

## 3. Database Schema (Prisma)
- Edit `prisma/schema.prisma`
- Add the model with `@@map("table_name")`
- **Rule**: Use JSONB (type `Json?`) for flexible lists.
- Run `npx prisma format`
- Run `npx prisma db push` (or create migration)

## 4. Business Logic (Service)
- Inject `PrismaService`.
- Implement CRUD methods.
- **Rule**: Handle errors using `NotFoundException` etc.

## 5. Exposure (Controller)
- Define `@Post`, `@Get` with `@Body(Dto)`.
- **Rule**: All endpoints must be documented (Swagger or simple comments).

## 6. Register Module
- Ensure it's imported in `app.module.ts`.

// turbo-all
