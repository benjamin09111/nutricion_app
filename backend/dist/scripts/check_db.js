"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const plans = await prisma.membershipPlan.findMany();
    console.log('--- MEMBERSHIP PLANS ---');
    console.log(JSON.stringify(plans, null, 2));
    const accounts = await prisma.account.findMany({
        take: 5,
        include: { subscription: { include: { plan: true } } }
    });
    console.log('--- ACCOUNTS (SAMPLE) ---');
    console.log(JSON.stringify(accounts, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check_db.js.map