"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.creation.findMany({
        include: { nutritionist: { include: { account: true } } },
        orderBy: { createdAt: 'desc' }
    });
    for (const c of result) {
        console.log(`[${c.type}] "${c.name}" - ${c.createdAt.toISOString()} - ${c.nutritionist.account.email}`);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-simple.js.map