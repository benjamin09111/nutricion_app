import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function find() {
    const list = await prisma.nutritionist.findMany({ 
        select: { id: true, fullName: true },
        take: 10
    });
    console.log(JSON.stringify(list, null, 2));
}
find().finally(() => prisma.$disconnect());
