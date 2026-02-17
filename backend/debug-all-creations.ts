import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.creation.findMany({
        include: { nutritionist: { include: { account: true } } }
    });
    console.log('--- ALL CREATIONS ---');
    result.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(`Name: ${c.name}`);
        console.log(`Type: ${c.type}`);
        console.log(`User: ${c.nutritionist.account.email}`);
        console.log(`Created: ${c.createdAt}`);
        console.log('---------------------');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
