# Database Environments

NutriNet uses one Prisma schema and one migration history for every environment.
Development and production differ only in connection URLs and stored data.

## Connections

- Development runtime uses `DATABASE_URL_DEV` and `DIRECT_URL_DEV`.
- Production runtime uses `DATABASE_URL` and `DIRECT_URL`.
- Outside production, the backend refuses to start without the `_DEV` variables.

## Schema Changes

1. Edit `prisma/schema.prisma`.
2. Create and review a migration against development:
   `npm run db:migrate:dev:create -- --name descriptive_name`
3. Apply it to development:
   `npm run db:migrate:dev`
4. Validate the application and commit the generated migration directory.
5. During production deployment, apply committed migrations with:
   `npx prisma migrate deploy`

Before considering database work complete, run:
`npm run db:check:dev`

This command fails when DEV has pending migrations or when its live schema
differs from `schema.prisma`.

Never use `prisma db push` in production. Never edit production tables manually
to mirror development. Production is updated only from reviewed migration files.

For a brand-new development database, initialize all committed migrations with:
`npm run db:migrate:dev:deploy`

The current legacy migration history predates the first schema migration. If a
completely empty database cannot deploy because a base table does not exist,
bootstrap it once with `node scripts/run-prisma-dev.js db push`, then register
the existing history with `npm run db:migrate:dev:baseline`. This baseline
command refuses to run when development and production URLs are equal and must
never be used on a database containing production data.

## Safety

`npx prisma migrate dev` reads Prisma's standard variables directly and must not
be used in this repository. Use the `db:migrate:dev*` scripts so the development
URLs are explicitly mapped before Prisma starts.

All Prisma seed and maintenance scripts loaded through `loadPrismaEnv()` refuse
to run in production. Production startup also runs `npm run db:safety:check`,
which rejects catalog scripts containing `deleteMany`, `TRUNCATE`, or
`DELETE FROM`, and rejects new destructive migrations.

## What Must Stay Synchronized

- `prisma/schema.prisma`: canonical target schema.
- `prisma/migrations/`: immutable, ordered schema history.
- DEV and production table, column, index, constraint, and enum definitions.

Rows and business data are intentionally different. Do not copy production
patient or account data into development to make databases "match".

## Release Checklist

1. `npm run db:check:dev` passes.
2. The migration SQL is reviewed and contains no unintended destructive SQL.
3. The migration directory is committed with the backend code that needs it.
4. Production runs `prisma migrate deploy` before the new backend process starts.
5. Deployment logs confirm all committed migrations are applied.

`npm run start:prod` includes this migration gate. If the hosting platform uses a
custom start command, it must preserve the same order: migrate first, start Nest
second.

If production misses a migration, the new backend may query tables or columns
that do not exist. If production has manual schema changes, migration deploy may
fail or behave differently. In either case, stop the release; inspect drift and
repair it with a new non-destructive migration. Never repair drift by editing a
previously applied migration.

## Production Data Protection

- Seeds may add or update known system records but never clear tables first.
- Ingredients, restrictions, metrics, and resources are synchronized with
  `upsert`, `findFirst`/`create`, or `createMany({ skipDuplicates: true })`.
- User-owned records are never removed by migrations or deployment scripts.
- Account deletion endpoints are separate, explicit business operations and
  must remain scoped to the confirmed account.
- Supabase production backups or point-in-time recovery must remain enabled.
- Before a production migration, verify the latest backup and review the SQL.
- Periodically perform a restore drill into a separate project; a backup is not
  considered reliable until restoration has been tested.

If catalog data disappears, stop writes, do not run seeds, preserve logs, and
restore into a separate database first. Compare the restored data before any
production recovery operation.
