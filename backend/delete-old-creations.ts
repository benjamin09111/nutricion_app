import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.creation.deleteMany({
        where: {
            nutritionist: {
                account: {
                    email: 'nutri_1@gmail.com'
                }
            }
        }
    });
    console.log(`Deleted ${deleted.count} creations from nutri_1@gmail.com`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
