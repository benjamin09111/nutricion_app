"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const plans = await prisma.membershipPlan.findMany();
    console.log('--- ALL PLANS ---');
    console.log(JSON.stringify(plans, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=list_plans.js.map