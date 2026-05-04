"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const load_prisma_env_1 = require("./load-prisma-env");
const resource_seed_1 = require("./resource-seed");
(0, load_prisma_env_1.loadPrismaEnv)();
const prisma = new client_1.PrismaClient();
async function seed() {
    console.log('🌱 Replacing all resources from default-resources.json...');
    await prisma.$transaction(async (tx) => {
        await (0, resource_seed_1.replaceDefaultResources)(tx);
    });
}
seed()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-resources.js.map