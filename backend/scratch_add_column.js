"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.$executeRawUnsafe(`
    ALTER TABLE "membership_plans" 
    ADD COLUMN IF NOT EXISTS "is_coming_soon" BOOLEAN DEFAULT false;
  `);
    console.log('✅ Column is_coming_soon added successfully to membership_plans');
}
main()
    .catch((e) => {
    console.error('Error adding column:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=scratch_add_column.js.map