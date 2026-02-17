import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.creation.deleteMany({
        where: {
            name: {
                in: ['ejemplo test', 'test import']
            }
        }
    });
    console.log(`Deleted ${deleted.count} test creations.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
