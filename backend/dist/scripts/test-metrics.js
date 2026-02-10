"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    console.log('Testing metrics logic...');
    try {
        const totalUsers = await prisma.account.count({ where: { role: 'NUTRITIONIST' } });
        console.log('Total Users:', totalUsers);
        const revenueResult = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        });
        console.log('Revenue Result:', revenueResult);
        const latestMetric = await prisma.dailyMetric.findFirst({
            orderBy: { date: 'desc' }
        });
        console.log('Latest Metric:', latestMetric);
        const recentUsers = await prisma.nutritionist.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { account: true }
        });
        console.log('Recent Users Count:', recentUsers.length);
        console.log('Test successful');
    }
    catch (error) {
        console.error('Test failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
//# sourceMappingURL=test-metrics.js.map