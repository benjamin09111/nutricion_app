const fs = require('fs');
const path = require('path');
const { backendRoot } = require('./lib/env');

const forbiddenPatterns = [
  { label: 'deleteMany()', pattern: /\.deleteMany\s*\(/ },
  { label: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
  { label: 'DELETE FROM', pattern: /\bDELETE\s+FROM\b/i },
];

const legacyDestructiveMigrations = new Set([
  '20260208093753_add_personal_preferences_to_ingredients',
  '20260208105438_normalize_ingredients',
  '20260528000000_baseline_appointments',
]);

function filesIn(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(entryPath, predicate);
    return predicate(entryPath) ? [entryPath] : [];
  });
}

const candidates = [
  ...filesIn(path.join(backendRoot, 'prisma'), (file) =>
    /\.(ts|js|sql)$/.test(file) && !file.includes(`${path.sep}migrations${path.sep}`),
  ),
  ...filesIn(path.join(backendRoot, 'scripts'), (file) =>
    /\.(ts|js|sql)$/.test(file) &&
    !file.endsWith('check-data-safety.js') &&
    !file.endsWith('safe-migrate.js'),
  ),
  ...filesIn(path.join(backendRoot, 'src'), (file) =>
    /seed[^\\/]*\.ts$/i.test(file),
  ),
];

const violations = [];
for (const file of candidates) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(backendRoot, file)}: ${label}`);
    }
  }
}

const migrationsDir = path.join(backendRoot, 'prisma', 'migrations');
for (const entry of fs.readdirSync(migrationsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || legacyDestructiveMigrations.has(entry.name)) continue;
  const migrationPath = path.join(migrationsDir, entry.name, 'migration.sql');
  if (!fs.existsSync(migrationPath)) continue;
  const content = fs.readFileSync(migrationPath, 'utf-8');
  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`prisma/migrations/${entry.name}/migration.sql: ${label}`);
    }
  }
  if (/\bDROP\s+(TABLE|COLUMN)\b/i.test(content)) {
    violations.push(`prisma/migrations/${entry.name}/migration.sql: DROP TABLE/COLUMN`);
  }
}

if (violations.length > 0) {
  console.error('Destructive database operations are forbidden:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('Database data-safety check passed: no destructive catalog operations found.');
