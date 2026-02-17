"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const accounts = await prisma.account.findMany({
        include: { nutritionist: true }
    });
    accounts.forEach(a => {
        console.log(`${a.email} -> ${a.nutritionist?.id || 'NO NUTRITIONIST'}`);
    });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-accounts.js.map