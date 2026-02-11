
const { PrismaClient, UserRole, AccountStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
        { email: 'admin@gmail.com', role: UserRole.ADMIN_MASTER, fullName: 'Admin Master' },
        { email: 'nutri_1@gmail.com', role: UserRole.NUTRITIONIST, fullName: 'Nutricionista 1' },
        { email: 'nutri_2@gmail.com', role: UserRole.NUTRITIONIST, fullName: 'Nutricionista 2' }
    ];

    console.log('--- Starting Manual User Creation ---');

    for (const u of users) {
        try {
            const account = await prisma.account.upsert({
                where: { email: u.email },
                update: {
                    password: hashedPassword,
                    role: u.role,
                    status: AccountStatus.ACTIVE
                },
                create: {
                    email: u.email,
                    password: hashedPassword,
                    role: u.role,
                    status: AccountStatus.ACTIVE
                }
            });

            console.log(`Account ${u.email} created/updated.`);

            // Create Nutritionist profile (1:1 relation)
            await prisma.nutritionist.upsert({
                where: { accountId: account.id },
                update: {
                    fullName: u.fullName
                },
                create: {
                    accountId: account.id,
                    fullName: u.fullName
                }
            });

            console.log(`Profile for ${u.email} created/updated.`);
        } catch (err) {
            console.error(`Error creating user ${u.email}:`, err.message);
        }
    }

    console.log('\n--- Finished ---');
    console.log(`All passwords set to: ${password}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
