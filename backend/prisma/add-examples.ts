
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding example ingredients...');

    const exampleIngredients = [
        {
            name: 'Pechuga de Pollo (100g)',
            brandName: 'Super Pollo',
            categoryName: 'Carnes',
            price: 1200,
            unit: 'g',
            amount: 100,
            calories: 165.0,
            proteins: 31.0,
            lipids: 3.6,
            carbs: 0.0,
        },
        {
            name: 'Arroz Integral (100g)',
            brandName: 'Tucapel',
            categoryName: 'Legumbres y Cereales',
            price: 450,
            unit: 'g',
            amount: 100,
            calories: 111.0,
            proteins: 2.6,
            lipids: 0.9,
            carbs: 23.0,
        },
        {
            name: 'Palta Hass (Unidad)',
            brandName: 'Feria',
            categoryName: 'Frutas y Verduras',
            price: 800,
            unit: 'unidad',
            amount: 1,
            calories: 160.0,
            proteins: 2.0,
            lipids: 15.0,
            carbs: 9.0,
        },
        {
            name: 'Whey Protein Gold Standard',
            brandName: 'Optimum Nutrition',
            categoryName: 'Suplementos',
            price: 45990,
            unit: 'scoop',
            amount: 30,
            calories: 120.0,
            proteins: 24.0,
            lipids: 1.0,
            carbs: 3.0,
            verified: true,
        },
        {
            name: 'Leche Descremada (200ml)',
            brandName: 'Colun',
            categoryName: 'Lácteos',
            price: 990,
            unit: 'ml',
            amount: 200,
            calories: 66.0,
            proteins: 6.4,
            lipids: 0.2,
            carbs: 9.6,
        },
        {
            name: 'Huevo de Gallina (Unidad)',
            brandName: 'Cabaña Blanca',
            categoryName: 'Huevos',
            price: 250,
            unit: 'unidad',
            amount: 1,
            calories: 72.0,
            proteins: 6.3,
            lipids: 4.8,
            carbs: 0.4,
        },
        {
            name: 'Avena Instantánea (100g)',
            brandName: 'Quaker',
            categoryName: 'Legumbres y Cereales',
            price: 600,
            unit: 'g',
            amount: 100,
            calories: 389.0,
            proteins: 16.9,
            lipids: 6.9,
            carbs: 66.3,
        },
        {
            name: 'Creatina Monohidratada (5g)',
            brandName: 'NutraBio',
            categoryName: 'Suplementos',
            price: 29990,
            unit: 'g',
            amount: 5,
            calories: 0.0,
            proteins: 0.0,
            lipids: 0.0,
            carbs: 0.0,
        }
    ];

    for (const ing of exampleIngredients) {
        const { brandName, categoryName, ...rest } = ing;

        const category = await prisma.ingredientCategory.upsert({
            where: { name: categoryName },
            update: {},
            create: { name: categoryName },
        });

        const brand = brandName ? await prisma.ingredientBrand.upsert({
            where: { name: brandName },
            update: {},
            create: { name: brandName },
        }) : null;

        // Check if ingredient exists by name to avoid duplicates
        const existing = await prisma.ingredient.findFirst({
            where: { name: rest.name }
        });

        if (!existing) {
            await prisma.ingredient.create({
                data: {
                    ...rest,
                    categoryId: category.id,
                    brandId: brand?.id || null,
                    isPublic: true,
                    verified: rest.name.toLowerCase().includes('protein') || rest.name.toLowerCase().includes('creatina'),
                }
            });
            console.log(`✅ Added: ${rest.name}`);
        } else {
            console.log(`⏩ Skipped (already exists): ${rest.name}`);
        }
    }

    console.log('🏁 Finished adding examples.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
