import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const result = await prisma.creation.findMany({
        include: { nutritionist: { include: { account: true } } },
        orderBy: { createdAt: 'desc' }
    });
    for (const c of result) {
        console.log(`[${c.type}] "${c.name}" - ${c.createdAt.toISOString()} - ${c.nutritionist.account.email}`);
    }
}
main().finally(() => prisma.$disconnect());
