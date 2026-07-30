const { spawnSync } = require('child_process');
const { backendRoot } = require('./lib/env');

function run(args) {
  const result = spawnSync('node', ['scripts/run-prisma-dev.js', ...args], {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(['migrate', 'status']);
run([
  'migrate',
  'diff',
  '--from-schema-datasource',
  'prisma/schema.prisma',
  '--to-schema-datamodel',
  'prisma/schema.prisma',
  '--exit-code',
]);

console.log('[Prisma DEV] Migration history and live schema are synchronized.');
