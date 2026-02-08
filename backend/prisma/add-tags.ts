
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🏷️ Adding tags to examples...');

    const tagMappings = [
        { name: 'Pechuga de Pollo (100g)', tags: ['Proteico', 'Bajo en Grasa'] },
        { name: 'Whey Protein Gold Standard', tags: ['Suplemento', 'Proteico', 'Fitness'] },
        { name: 'Arroz Integral (100g)', tags: ['Fibra', 'Carbohidratos Complejos'] },
        { name: 'Palta Hass (Unidad)', tags: ['Keto', 'Vegano', 'Grasas Saludables'] },
        { name: 'Creatina Monohidratada (5g)', tags: ['Fitness', 'Rendimiento'] },
        { name: 'Leche Descremada (200ml)', tags: ['Lácteos', 'Proteico'] },
        { name: 'Avena Instantánea (100g)', tags: ['Vegano', 'Fibra', 'Desayuno'] },
    ];

    for (const mapping of tagMappings) {
        const ingredient = await prisma.ingredient.findFirst({
            where: { name: mapping.name }
        });

        if (ingredient) {
            for (const tagName of mapping.tags) {
                const tag = await prisma.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: { name: tagName }
                });

                await prisma.ingredient.update({
                    where: { id: ingredient.id },
                    data: {
                        tags: {
                            connect: { id: tag.id }
                        }
                    }
                });
            }
            console.log(`✅ Tags added to: ${mapping.name}`);
        }
    }
}

main().finally(() => prisma.$disconnect());
