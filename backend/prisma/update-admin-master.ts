import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@nutrinet.cl';

    const account = await prisma.account.update({
        where: { email },
        data: { role: UserRole.ADMIN_MASTER },
    });

    console.log(`✅ ${account.email} ahora es: ${account.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
