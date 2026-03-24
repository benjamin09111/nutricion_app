const { getDbSummary, loadEnvFile, redactDbUrl } = require('./lib/env');

function main() {
  const envArg = process.argv.find((arg) => arg.startsWith('--env='));
  const envFile = envArg ? envArg.split('=')[1] : '.env';
  const { filePath, env } = loadEnvFile(envFile);

  const targetUrl = env.DIRECT_URL || env.DATABASE_URL;
  const summary = getDbSummary(targetUrl);

  console.log(`Env file: ${filePath}`);
  console.log(`DATABASE_URL: ${redactDbUrl(env.DATABASE_URL)}`);
  console.log(`DIRECT_URL: ${redactDbUrl(env.DIRECT_URL)}`);
  console.log(`Host: ${summary.host ?? '(unknown)'}`);
  console.log(`Database: ${summary.database ?? '(unknown)'}`);
  console.log(`Target type: ${summary.isLocal ? 'LOCAL DEV' : 'REMOTE / TESTERS'}`);
}

main();
