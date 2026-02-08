"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    try {
        const count = await prisma.$queryRaw `SELECT count(*) FROM ingredients`;
        console.log('Count:', count);
    }
    catch (e) {
        console.error('Error:', e.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
run();
//# sourceMappingURL=check-count.js.map