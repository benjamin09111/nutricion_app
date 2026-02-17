"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=debug-creations.js.map