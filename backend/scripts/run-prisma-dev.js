const { spawnSync } = require('child_process');
const { backendRoot, loadEnvFile, redactDbUrl } = require('./lib/env');

function main() {
  const { env } = loadEnvFile('.env');
  const databaseUrl = env.DATABASE_URL_DEV;
  const directUrl = env.DIRECT_URL_DEV || databaseUrl;

  if (!databaseUrl || !directUrl) {
    throw new Error(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required. Refusing to run Prisma against DATABASE_URL.',
    );
  }

  console.log(`[Prisma DEV] Target: ${redactDbUrl(directUrl)}`);
  const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
    },
  });

  process.exit(result.status ?? 1);
}

main();
