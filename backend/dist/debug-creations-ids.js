"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const creations = await prisma.creation.findMany({
        select: {
            name: true,
            nutritionistId: true,
            nutritionist: {
                select: {
                    accountId: true,
                    account: {
                        select: {
                            email: true
                        }
                    }
                }
            }
        }
    });
    console.log('Creations Details:', JSON.stringify(creations, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-creations-ids.js.map