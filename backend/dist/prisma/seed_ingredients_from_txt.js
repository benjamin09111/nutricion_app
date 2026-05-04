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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const load_prisma_env_1 = require("./load-prisma-env");
(0, load_prisma_env_1.loadPrismaEnv)();
const prisma = new client_1.PrismaClient();
function normalizeIngredientKey(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
async function main() {
    console.log('Start seeding ingredients and categories (without deletion)...');
    const categoriesPath = path.resolve(__dirname, '../../categories.txt');
    const ingredientsPath = path.resolve(__dirname, '../../ingredients.txt');
    if (!fs.existsSync(categoriesPath)) {
        throw new Error(`Categories file not found at ${categoriesPath}`);
    }
    if (!fs.existsSync(ingredientsPath)) {
        throw new Error(`Ingredients file not found at ${ingredientsPath}`);
    }
    console.log('Seeding categories...');
    const categoryNames = fs
        .readFileSync(categoriesPath, 'utf-8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    for (const name of categoryNames) {
        await prisma.ingredientCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const categories = await prisma.ingredientCategory.findMany();
    const categoryMap = new Map(categories.map((category) => [category.name, category.id]));
    console.log(`Categories ready: ${categories.length}`);
    const lines = fs
        .readFileSync(ingredientsPath, 'utf-8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    console.log(`Ingredient rows found: ${lines.length}`);
    const parsedIngredients = [];
    const seenKeys = new Set();
    let skipped = 0;
    for (const line of lines) {
        const cols = line.split(',');
        if (cols.length < 12) {
            skipped += 1;
            continue;
        }
        const name = cols[0].trim();
        const categoryName = cols[1].trim();
        const categoryId = categoryMap.get(categoryName);
        if (!name || !categoryId) {
            skipped += 1;
            continue;
        }
        const duplicateKey = normalizeIngredientKey(name);
        if (seenKeys.has(duplicateKey)) {
            continue;
        }
        seenKeys.add(duplicateKey);
        parsedIngredients.push({
            name,
            categoryId,
            calories: parseFloat(cols[2]) || 0,
            proteins: parseFloat(cols[3]) || 0,
            carbs: parseFloat(cols[4]) || 0,
            lipids: parseFloat(cols[5]) || 0,
            sugars: parseFloat(cols[6]) || 0,
            fiber: parseFloat(cols[7]) || 0,
            sodium: parseFloat(cols[8]) || 0,
            unit: cols[9].trim() || 'g',
            amount: parseFloat(cols[10]) || 100,
            price: parseInt(cols[11], 10) || 0,
            isPublic: true,
            verified: true,
        });
    }
    const existingIngredients = await prisma.ingredient.findMany({
        select: { name: true },
    });
    const existingNames = new Set(existingIngredients.map((ingredient) => ingredient.name.trim().toLowerCase()));
    const missingIngredients = parsedIngredients.filter((ingredient) => !existingNames.has(ingredient.name.trim().toLowerCase()));
    console.log(`New ingredients to insert: ${missingIngredients.length}`);
    if (missingIngredients.length > 0) {
        const result = await prisma.ingredient.createMany({
            data: missingIngredients,
            skipDuplicates: false,
        });
        console.log(`Inserted ingredients: ${result.count}`);
    }
    else {
        console.log('No new ingredients to insert.');
    }
    console.log(`Skipped rows: ${skipped}`);
    console.log('Seeding finished.');
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_ingredients_from_txt.js.map