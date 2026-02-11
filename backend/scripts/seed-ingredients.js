
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

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
    console.log('--- Start seeding ingredients and categories (NO DELETION) ---');

    try {
        // 1. Seed Categories first (UPSERT)
        console.log('Step 1: Seeding categories...');
        for (const name of FIXED_CATEGORIES) {
            await prisma.ingredientCategory.upsert({
                where: { name },
                update: {},
                create: { name }
            });
        }

        const categories = await prisma.ingredientCategory.findMany();
        const categoryMap = new Map(categories.map(c => [c.name, c.id]));
        console.log(`Success: ${categories.length} categories ready.`);

        // 2. Load ingredients from ingredients.txt
        const ingredientsPath = path.resolve(__dirname, '../../ingredients.txt');
        console.log(`Step 2: Reading ingredients from: ${ingredientsPath}`);

        if (!fs.existsSync(ingredientsPath)) {
            console.error(`Error: File not found at ${ingredientsPath}`);
            return;
        }

        const fileContent = fs.readFileSync(ingredientsPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        console.log(`Step 3: Found ${lines.length} potential records.`);

        const ingredientsData = [];
        let skipCount = 0;

        for (const line of lines) {
            const cols = line.split(',');
            if (cols.length < 10) continue;

            const name = cols[0].trim();
            const csvCategory = cols[1].trim();
            const categoryId = categoryMap.get(csvCategory);

            if (!categoryId) {
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
                price: Math.floor(price),
                isPublic: true,
                verified: true
            });
        }

        // 3. Insert Ingredients
        if (ingredientsData.length > 0) {
            console.log(`Step 4: Inserting ${ingredientsData.length} records into DB...`);
            // Avoid creating thousands of records at once if it's too much, but createMany should handle it
            const result = await prisma.ingredient.createMany({
                data: ingredientsData,
                skipDuplicates: true,
            });
            console.log(`Success: Successfully inserted ${result.count} ingredients.`);
        }

        console.log(`--- Process Finished ---`);
        console.log(`Total processed: ${ingredientsData.length}`);
        console.log(`Skipped: ${skipCount}`);
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
