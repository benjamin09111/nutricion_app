---
name: prisma-migration
description: Playbook para crear y ejecutar migraciones seguras con Prisma ORM en la base de datos PostgreSQL.
---
# Prisma Migrations Playbook

Use this playbook whenever you modify `schema.prisma` or need to execute migrations.

## Safety First
- **No Destructive Actions**: Never drop tables or columns containing production user/clinical data. If renaming a column, perform it via a safe deprecation strategy: add new column, run script to copy data, then drop old column in a later release.
- **JSONB Updates**: PostgreSQL JSONB fields are flexible. When modifying JSON structure:
  - Document the schema changes in the PR/walkthrough.
  - Write a fallback default in the query/code (e.g. `metadata?.someField ?? defaultVal`).

## Migration Workflow
1. Modify `backend/prisma/schema.prisma`.
2. Generate schema changes locally:
   ```bash
   npx prisma generate
   ```
3. Create migration files without applying directly to verify SQL:
   ```bash
   npx prisma migrate dev --create-only --name name_of_migration
   ```
4. Review the generated SQL inside `backend/prisma/migrations/`.
5. Apply migration safely:
   ```bash
   npx prisma migrate dev
   ```
