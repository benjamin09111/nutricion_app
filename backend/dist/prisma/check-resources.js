"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const nutritionists = await prisma.nutritionist.findMany({
        select: { id: true, fullName: true }
    });
    console.log("Nutritionists in DB:", nutritionists);
    const resources = await prisma.resource.findMany({
        where: { nutritionistId: { not: null } },
        select: { id: true, title: true, nutritionistId: true, isPublic: true }
    });
    console.log("Private/Nutri Resources in DB:", resources);
}
main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=check-resources.js.map