import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const c = await prisma.creation.findFirst({
        where: { name: 'ejemplo test' }
    });
    console.log('Creation Content:', JSON.stringify(c, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
