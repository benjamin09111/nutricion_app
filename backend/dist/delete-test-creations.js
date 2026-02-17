"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const deleted = await prisma.creation.deleteMany({
        where: {
            name: {
                in: ['ejemplo test', 'test import']
            }
        }
    });
    console.log(`Deleted ${deleted.count} test creations.`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=delete-test-creations.js.map