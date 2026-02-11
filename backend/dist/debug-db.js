"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const accounts = await prisma.account.findMany({
        include: { nutritionist: true }
    });
    console.log('Accounts and nutritionists:');
    accounts.forEach(a => {
        console.log(`Account ID: ${a.id}, Email: ${a.email}, Role: ${a.role}, Nutritionist ID: ${a.nutritionist?.id || 'NULL'}`);
    });
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-db.js.map