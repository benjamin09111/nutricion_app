"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rootDir = path.resolve(__dirname, '../..');
const categoriesPath = path.join(rootDir, 'categories.txt');
const ingredientsPath = path.join(rootDir, 'ingredients.txt');
const outputDir = path.join(__dirname, 'generated');
const outputPath = path.join(outputDir, 'seed_ingredients_from_txt.sql');
function escapeSql(value) {
    return value.replace(/'/g, "''");
}
function parseNumber(raw) {
    const normalized = raw.trim().replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
function parseInteger(raw) {
    const parsed = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}
function normalizeIngredientKey(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
function readLines(filePath) {
    return fs
        .readFileSync(filePath, 'utf-8')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}
function buildCategoryStatements(categories) {
    return categories.map((categoryName) => {
        const safeCategoryName = escapeSql(categoryName);
        return `INSERT INTO "ingredient_categories" ("id", "name")
SELECT gen_random_uuid()::text, '${safeCategoryName}'
WHERE NOT EXISTS (
  SELECT 1 FROM "ingredient_categories" WHERE lower("name") = lower('${safeCategoryName}')
);`;
    });
}
function buildIngredientStatements(rows) {
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
      AND i."brand_id" IS NULL
  );`;
    });
}
function parseIngredientRows(lines, validCategories) {
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
        `WITH ranked AS (
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
);`,
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
//# sourceMappingURL=generate_seed_sql.js.map