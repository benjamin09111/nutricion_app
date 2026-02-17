import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const creations = await prisma.creation.findMany({
        select: {
            name: true,
            nutritionistId: true,
            nutritionist: {
                select: {
                    accountId: true,
                    account: {
                        select: {
                            email: true
                        }
                    }
                }
            }
        }
    });
    console.log('Creations Details:', JSON.stringify(creations, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
