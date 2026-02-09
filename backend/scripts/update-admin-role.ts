import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const updated = await prisma.account.update({
            where: { email: 'admin@nutrisaas.com' },
            data: { role: 'ADMIN_GENERAL' }
        });
        console.log('Updated user admin@nutrisaas.com to ADMIN_GENERAL');
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
