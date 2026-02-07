import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'joakomask@gmail.com';
    // Use a default password since none was provided
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.account.upsert({
        where: { email },
        update: {
            role: UserRole.ADMIN_MASTER,
            status: AccountStatus.ACTIVE,
            // Only update password if you want to reset it. For now let's reset it to be safe.
            password: hashedPassword,
        },
        create: {
            email,
            password: hashedPassword,
            role: UserRole.ADMIN_MASTER,
            status: AccountStatus.ACTIVE,
        },
    });

    console.log(`Admin Master account configured for: ${user.email}`);
    console.log(`Password set to: ${plainPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
