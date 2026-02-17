import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.account.findMany({
        include: { nutritionist: true }
    });
    accounts.forEach(a => {
        console.log(`${a.email} -> ${a.nutritionist?.id || 'NO NUTRITIONIST'}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
