"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=delete-old-creations.js.map