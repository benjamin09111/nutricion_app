const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { backendRoot, ensureSafeRemoteFlag, loadEnvFile } = require('./lib/env');

const destructivePatterns = [
  /DROP TABLE/i,
  /DROP COLUMN/i,
  /TRUNCATE TABLE/i,
  /DELETE FROM/i,
];

function latestMigrationFile() {
  const migrationsDir = path.resolve(backendRoot, 'prisma', 'migrations');
  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const latestDir = entries[entries.length - 1];
  if (!latestDir) {
    return null;
  }

  return path.resolve(migrationsDir, latestDir, 'migration.sql');
}

function assertNonDestructiveMigration(migrationPath, args) {
  if (!migrationPath || !fs.existsSync(migrationPath)) {
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const matched = destructivePatterns.filter((pattern) => pattern.test(sql));
  const allowDestructive = args.includes('--allow-destructive');

  if (matched.length > 0 && !allowDestructive) {
    throw new Error(
      `Latest migration looks destructive (${migrationPath}). Review it and re-run with --allow-destructive only if you are absolutely sure.`,
    );
  }
}

function main() {
  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith('--env='));
  const envFile = envArg ? envArg.split('=')[1] : '.env';
  const { env } = loadEnvFile(envFile);
  ensureSafeRemoteFlag(env.DIRECT_URL || env.DATABASE_URL, args);

  const migrationPath = latestMigrationFile();
  assertNonDestructiveMigration(migrationPath, args);

  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: env.DIRECT_URL || env.DATABASE_URL,
      DIRECT_URL: env.DIRECT_URL || env.DATABASE_URL,
    },
  });

  process.exit(result.status ?? 1);
}

main();
