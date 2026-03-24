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
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed process...');
    const categoriesPath = path.join(__dirname, '..', '..', 'categories.txt');
    const categoriesRaw = fs.readFileSync(categoriesPath, 'utf8');
    const categoryNames = categoriesRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`Found ${categoryNames.length} categories.`);
    const categoryMap = new Map();
    for (const name of categoryNames) {
        const category = await prisma.ingredientCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categoryMap.set(name, category.id);
    }
    const ingredientsPath = path.join(__dirname, '..', '..', 'ingredients.txt');
    const ingredientsRaw = fs.readFileSync(ingredientsPath, 'utf8');
    const lines = ingredientsRaw.split('\n').filter(line => line.trim().length > 0);
    console.log(`Found ${lines.length} ingredients.`);
    await prisma.ingredient.deleteMany({ where: { isPublic: true, verified: true } });
    const ingredientsData = [];
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 12)
            continue;
        const [name, categoryName, calories, proteins, carbs, lipids, sugars, fiber, sodium, unit, amount, price] = parts;
        const categoryId = categoryMap.get(categoryName.trim());
        if (!categoryId) {
            console.warn(`Category not found for ingredient: ${name} (${categoryName})`);
            continue;
        }
        ingredientsData.push({
            name: name.trim(),
            categoryId,
            calories: parseFloat(calories) || 0,
            proteins: parseFloat(proteins) || 0,
            carbs: parseFloat(carbs) || 0,
            lipids: parseFloat(lipids) || 0,
            sugars: parseFloat(sugars) || 0,
            fiber: parseFloat(fiber) || 0,
            sodium: parseFloat(sodium) || 0,
            unit: unit.trim(),
            amount: parseFloat(amount) || 100,
            price: parseInt(price) || 0,
            isPublic: true,
            verified: true,
        });
    }
    let createdCount = 0;
    if (ingredientsData.length > 0) {
        const result = await prisma.ingredient.createMany({
            data: ingredientsData,
            skipDuplicates: true,
        });
        createdCount = result.count;
    }
    console.log(`Seeding finished. Created/Verified ${createdCount} ingredients.`);
}
main()
    .catch((e) => {
    console.error('SEED ERROR:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-ingredients.js.map