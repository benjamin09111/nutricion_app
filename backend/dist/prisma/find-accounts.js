"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function find() {
    const list = await prisma.account.findMany({
        select: { email: true, nutritionist: { select: { id: true, fullName: true } } },
        take: 10
    });
    console.log(JSON.stringify(list, null, 2));
}
find().finally(() => prisma.$disconnect());
//# sourceMappingURL=find-accounts.js.map