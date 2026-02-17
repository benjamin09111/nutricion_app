import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const creations = await prisma.creation.findMany({
        select: {
            name: true,
            type: true,
            nutritionist: {
                select: {
                    fullName: true,
                    account: {
                        select: {
                            email: true
                        }
                    }
                }
            }
        }
    });
    creations.forEach(c => {
        console.log(`- ${c.name} (${c.type}) by ${c.nutritionist.fullName} <${c.nutritionist.account.email}>`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
