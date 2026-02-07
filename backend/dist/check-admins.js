"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    const admins = await prisma.account.findMany({
        where: {
            role: {
                in: ['ADMIN_MASTER', 'ADMIN_GENERAL']
            }
        },
        select: {
            email: true,
            role: true
        }
    });
    console.log(JSON.stringify(admins, null, 2));
    await prisma.$disconnect();
}
main();
//# sourceMappingURL=check-admins.js.map