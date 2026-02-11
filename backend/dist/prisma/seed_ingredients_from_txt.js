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
const FIXED_CATEGORIES = [
    "Lácteos",
    "Huevos",
    "Carnes y Vísceras",
    "Pescados y Mariscos",
    "Semillas y Nueces",
    "Cereales y Derivados",
    "Papas",
    "Grasas y Aceites",
    "Verduras",
    "Frutas",
    "Azúcares y Miel",
    "Alimentos Dulces",
    "Postres de Leche",
    "Jugos y Néctares",
    "Refrescos en Polvo",
    "Bebidas",
    "Bebidas Alcohólicas",
    "Productos Salados",
    "Salsas",
    "Especias",
    "Endulzantes",
    "Platos Preparados"
];
async function main() {
    console.log('🔄 Start seeding ingredients and categories (NO DELETION)...');
    console.log('📦 Seeding categories...');
    for (const name of FIXED_CATEGORIES) {
        await prisma.ingredientCategory.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }
    const categories = await prisma.ingredientCategory.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    console.log(`✅ ${categories.length} categories ready.`);
    const ingredientsPath = path.resolve(__dirname, '../../../ingredients.txt');
    console.log(`📂 Reading ingredients from: ${ingredientsPath}`);
    if (!fs.existsSync(ingredientsPath)) {
        console.error(`❌ File not found at ${ingredientsPath}`);
        return;
    }
    const fileContent = fs.readFileSync(ingredientsPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    console.log(`📊 Found ${lines.length} potential records.`);
    const ingredientsData = [];
    let skipCount = 0;
    for (const line of lines) {
        const cols = line.split(',');
        if (cols.length < 10) {
            console.warn(`⚠️ skipping invalid line: ${line}`);
            continue;
        }
        const name = cols[0].trim();
        const csvCategory = cols[1].trim();
        const categoryId = categoryMap.get(csvCategory);
        if (!categoryId) {
            console.warn(`⚠️ Category not found for "${name}": "${csvCategory}"`);
            skipCount++;
            continue;
        }
        const calories = parseFloat(cols[2]) || 0;
        const proteins = parseFloat(cols[3]) || 0;
        const carbs = parseFloat(cols[4]) || 0;
        const lipids = parseFloat(cols[5]) || 0;
        const sugars = parseFloat(cols[6]) || 0;
        const fiber = parseFloat(cols[7]) || 0;
        const sodium = parseFloat(cols[8]) || 0;
        const unit = cols[9].trim();
        const amount = parseFloat(cols[10]) || 100;
        const price = parseInt(cols[11]) || 0;
        ingredientsData.push({
            name,
            categoryId,
            calories,
            proteins,
            carbs,
            lipids,
            sugars,
            fiber,
            sodium,
            unit,
            amount,
            price,
            isPublic: true,
            verified: true
        });
    }
    if (ingredientsData.length > 0) {
        console.log(`🚀 Inserting ${ingredientsData.length} records into DB...`);
        try {
            const result = await prisma.ingredient.createMany({
                data: ingredientsData,
                skipDuplicates: false,
            });
            console.log(`✅ Successfully inserted ${result.count} ingredients.`);
        }
        catch (e) {
            console.error(`❌ Error inserting ingredients:`, e.message);
        }
    }
    console.log(`\n🎉 Process Finished!`);
    console.log(`✅ Total inserted: ${ingredientsData.length}`);
    console.log(`❌ Skipped: ${skipCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_ingredients_from_txt.js.map