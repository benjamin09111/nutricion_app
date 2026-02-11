
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.account.count();
        console.log(`Total accounts in DB: ${count}`);
        const accounts = await prisma.account.findMany({
            include: { nutritionist: true }
        });
        console.log('--- Accounts Report ---');
        accounts.forEach(a => {
            console.log(`Email: ${a.email}`);
            console.log(`  ID: ${a.id}`);
            console.log(`  Role: ${a.role}`);
            console.log(`  Nutritionist: ${a.nutritionist ? a.nutritionist.id : 'NONE'}`);
            console.log('-----------------------');
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
