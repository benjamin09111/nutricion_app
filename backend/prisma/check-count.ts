
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    try {
        const count = await prisma.$queryRaw`SELECT count(*) FROM ingredients`;
        console.log('Count:', count);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
