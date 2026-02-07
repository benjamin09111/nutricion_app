import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const admins = await prisma.account.findMany({
        where: {
            role: {
                in: ['ADMIN_MASTER', 'ADMIN_GENERAL']
            }
        },
        select: {
            email: true,
            role: true
        }
    });
    console.log(JSON.stringify(admins, null, 2));
    await prisma.$disconnect();
}

main();
