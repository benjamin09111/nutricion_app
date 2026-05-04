"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const updated = await prisma.account.update({
            where: { email: 'admin@nutrisaas.com' },
            data: { role: 'ADMIN_GENERAL' }
        });
        console.log('Updated user admin@nutrisaas.com to ADMIN_GENERAL');
    }
    catch (error) {
        console.error('Error updating user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=update-admin-role.js.map