const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { backendRoot, loadEnvFile, redactDbUrl } = require('./lib/env');

async function main() {
  if (!process.argv.includes('--confirm-empty-dev')) {
    throw new Error(
      'This command is only for an empty development database. Re-run with --confirm-empty-dev.',
    );
  }

  const { env } = loadEnvFile('.env');
  const databaseUrl = env.DATABASE_URL_DEV;
  const directUrl = env.DIRECT_URL_DEV || databaseUrl;
  if (!databaseUrl || !directUrl) {
    throw new Error('Development database URLs are required.');
  }
  if (databaseUrl === env.DATABASE_URL || directUrl === env.DIRECT_URL) {
    throw new Error('Development and production database URLs must be different.');
  }

  const migrationsDir = path.resolve(backendRoot, 'prisma', 'migrations');
  const migrations = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  console.log(`[Prisma DEV baseline] Target: ${redactDbUrl(directUrl)}`);
  process.env.NODE_ENV = 'development';
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;

  const prisma = new PrismaClient();
  const appliedRows = await prisma.$queryRawUnsafe(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  );
  await prisma.$disconnect();
  const applied = new Set(appliedRows.map((row) => row.migration_name));

  for (const migration of migrations) {
    if (applied.has(migration)) {
      continue;
    }
    const result = spawnSync(
      'npx',
      ['prisma', 'migrate', 'resolve', '--applied', migration],
      {
        cwd: backendRoot,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          DATABASE_URL: databaseUrl,
          DIRECT_URL: directUrl,
        },
      },
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
