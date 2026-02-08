import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const category = await prisma.ingredientCategory.findUnique({
        where: { name: 'Platos Preparados' },
        include: { _count: { select: { ingredients: true } } }
    });

    if (!category) {
        console.log('❌ Category "Platos Preparados" NOT found.');
    } else {
        console.log(`✅ Category "Platos Preparados" found with ${category._count.ingredients} ingredients.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
