import * as fs from 'fs';
import * as path from 'path';

type IngredientRow = {
  name: string;
  categoryName: string;
  calories: number;
  proteins: number;
  carbs: number;
  lipids: number;
  sugars: number;
  fiber: number;
  sodium: number;
  unit: string;
  amount: number;
  price: number;
};

const rootDir = path.resolve(__dirname, '../..');
const categoriesPath = path.join(rootDir, 'categories.txt');
const ingredientsPath = path.join(rootDir, 'ingredients.txt');
const outputDir = path.join(__dirname, 'generated');
const outputPath = path.join(outputDir, 'seed_ingredients_from_txt.sql');

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function parseNumber(raw: string): number {
  const normalized = raw.trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(raw: string): number {
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readLines(filePath: string): string[] {
  return fs
    .readFileSync(filePath, 'utf-8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildCategoryStatements(categories: string[]): string[] {
  return categories.map((categoryName) => {
    const safeCategoryName = escapeSql(categoryName);
    return `INSERT INTO "ingredient_categories" ("id", "name")
SELECT gen_random_uuid()::text, '${safeCategoryName}'
WHERE NOT EXISTS (
  SELECT 1 FROM "ingredient_categories" WHERE lower("name") = lower('${safeCategoryName}')
);`;
  });
}

function buildIngredientStatements(rows: IngredientRow[]): string[] {
  return rows.map((row) => {
    const safeName = escapeSql(row.name);
    const safeCategoryName = escapeSql(row.categoryName);
    const safeUnit = escapeSql(row.unit);

    return `INSERT INTO "ingredients" (
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
      AND i."category_id" = c."id"
  );`;
  });
}

function parseIngredientRows(lines: string[], validCategories: Set<string>): IngredientRow[] {
  const rows: IngredientRow[] = [];

  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 12) {
      continue;
    }

    const categoryName = cols[1].trim();
    if (!validCategories.has(categoryName.toLowerCase())) {
      continue;
    }

    rows.push({
      name: cols[0].trim(),
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
  if (!fs.existsSync(categoriesPath)) {
    throw new Error(`Missing categories file at ${categoriesPath}`);
  }

  if (!fs.existsSync(ingredientsPath)) {
    throw new Error(`Missing ingredients file at ${ingredientsPath}`);
  }

  const categories = readLines(categoriesPath);
  const ingredients = readLines(ingredientsPath);
  const validCategories = new Set(categories.map((category) => category.toLowerCase()));
  const ingredientRows = parseIngredientRows(ingredients, validCategories);

  const statements = [
    '-- Generated file. Rebuild with: npx tsx prisma/generate_seed_sql.ts',
    'BEGIN;',
    ...buildCategoryStatements(categories),
    ...buildIngredientStatements(ingredientRows),
    'COMMIT;',
    '',
  ];

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, statements.join('\n\n'), 'utf-8');

  console.log(`SQL seed generated at ${outputPath}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Ingredients: ${ingredientRows.length}`);
}

main();
