"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const c = await prisma.creation.findFirst({
        where: { name: 'ejemplo test' }
    });
    console.log('Creation Content:', JSON.stringify(c, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-creation-content.js.map