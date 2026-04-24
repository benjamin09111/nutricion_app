const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { backendRoot, ensureSafeRemoteFlag, loadEnvFile } = require('./lib/env');

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function parseNumber(raw) {
  const normalized = String(raw).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(raw) {
  const parsed = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeIngredientKey(name) {
  return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
}

function readLines(filePath) {
  return fs
    .readFileSync(filePath, 'utf-8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSql(categories, ingredients) {
  const parts = ['BEGIN;'];
  parts.push(`
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(btrim("name")), COALESCE("brand_id", '')
      ORDER BY "verified" DESC, "is_public" DESC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "ingredients"
)
DELETE FROM "ingredients"
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE rn > 1
);`);

  for (const categoryName of categories) {
    const safeCategoryName = escapeSql(categoryName);
    parts.push(`INSERT INTO "ingredient_categories" ("id", "name")
SELECT gen_random_uuid()::text, '${safeCategoryName}'
WHERE NOT EXISTS (
  SELECT 1 FROM "ingredient_categories" WHERE lower("name") = lower('${safeCategoryName}')
);`);
  }

  for (const row of ingredients) {
    const safeName = escapeSql(row.name);
    const safeCategoryName = escapeSql(row.categoryName);
    const safeUnit = escapeSql(row.unit);

    parts.push(`INSERT INTO "ingredients" (
  "id",
  "name",
  "price",
  "unit",
  "amount",
  "calories",
  "proteins",
  "lipids",
  "carbs",
  "sugars",
  "fiber",
  "sodium",
  "is_public",
  "verified",
  "category_id",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  '${safeName}',
  ${row.price},
  '${safeUnit}',
  ${row.amount},
  ${row.calories},
  ${row.proteins},
  ${row.lipids},
  ${row.carbs},
  ${row.sugars},
  ${row.fiber},
  ${row.sodium},
  TRUE,
  TRUE,
  c."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ingredient_categories" c
WHERE lower(c."name") = lower('${safeCategoryName}')
  AND NOT EXISTS (
    SELECT 1
    FROM "ingredients" i
    WHERE lower(i."name") = lower('${safeName}')
      AND i."brand_id" IS NULL
  );`);
  }

  parts.push('COMMIT;');
  return parts.join('\n\n');
}

function parseIngredients(lines, validCategories) {
  const rows = [];
  const seenKeys = new Set();

  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 12) {
      continue;
    }

    const categoryName = cols[1].trim();
    if (!validCategories.has(categoryName.toLowerCase())) {
      continue;
    }

    const name = cols[0].trim();
    const key = normalizeIngredientKey(name);
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    rows.push({
      name,
      categoryName,
      calories: parseNumber(cols[2]),
      proteins: parseNumber(cols[3]),
      carbs: parseNumber(cols[4]),
      lipids: parseNumber(cols[5]),
      sugars: parseNumber(cols[6]),
      fiber: parseNumber(cols[7]),
      sodium: parseNumber(cols[8]),
      unit: cols[9].trim() || 'g',
      amount: parseNumber(cols[10]) || 100,
      price: parseInteger(cols[11]),
    });
  }

  return rows;
}

function main() {
  const envArg = process.argv.find((arg) => arg.startsWith('--env='));
  const envFile = envArg ? envArg.split('=')[1] : '.env';
  const { env } = loadEnvFile(envFile);
  ensureSafeRemoteFlag(env.DIRECT_URL || env.DATABASE_URL, process.argv.slice(2));

  const categoriesPath = path.resolve(backendRoot, '..', 'categories.txt');
  const ingredientsPath = path.resolve(backendRoot, '..', 'ingredients.txt');
  const generatedDir = path.resolve(backendRoot, 'prisma', 'generated');
  const sqlPath = path.resolve(generatedDir, 'seed_ingredients_from_txt.sql');

  const categories = readLines(categoriesPath);
  const validCategories = new Set(categories.map((category) => category.toLowerCase()));
  const ingredientRows = parseIngredients(readLines(ingredientsPath), validCategories);
  const sql = buildSql(categories, ingredientRows);

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(sqlPath, sql, 'utf-8');

  const execute = spawnSync(
    'npx',
    ['prisma', 'db', 'execute', '--file', sqlPath, '--schema', path.resolve(backendRoot, 'prisma', 'schema.prisma')],
    {
      cwd: backendRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: env.DIRECT_URL || env.DATABASE_URL,
      },
    },
  );

  if (execute.status !== 0) {
    process.exit(execute.status ?? 1);
  }

  console.log(`Catalog seed applied successfully from ${categoriesPath} and ${ingredientsPath}`);
}

main();
