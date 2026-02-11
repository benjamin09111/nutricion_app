
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Nutritionist Profile Sync ---\n');

    try {
        const accounts = await prisma.account.findMany({
            include: { nutritionist: true }
        });

        console.log(`Checking ${accounts.length} accounts...`);

        let fixedCount = 0;

        for (const account of accounts) {
            if (!account.nutritionist) {
                console.log(`Account ${account.email} (${account.role}) is missing a Nutritionist record. Creating one...`);

                await prisma.nutritionist.create({
                    data: {
                        accountId: account.id,
                        fullName: account.email.split('@')[0], // Use email part as default name
                    }
                });

                fixedCount++;
            } else {
                console.log(`Account ${account.email} already has a Nutritionist record (ID: ${account.nutritionist.id})`);
            }
        }

        console.log(`\nDONE! Fixed ${fixedCount} accounts.`);
        console.log('\nIMPORTANT: If you were already logged in, please LOGOUT and LOGIN again to update your token with the new nutritionistId.');

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
