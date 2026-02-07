"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const cache_manager_1 = require("@nestjs/cache-manager");
let MetricsService = MetricsService_1 = class MetricsService {
    prisma;
    cacheManager;
    logger = new common_1.Logger(MetricsService_1.name);
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async handleDailyMetrics() {
        this.logger.log('Running Daily Metrics Calculation Job...');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
            const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
            const revenueResult = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: startOfDay, lte: endOfDay }
                }
            });
            const dailyRevenue = Number(revenueResult._sum.amount || 0);
            const totalUsers = await this.prisma.account.count({ where: { role: 'NUTRITIONIST' } });
            const newUsers = await this.prisma.account.count({
                where: {
                    role: 'NUTRITIONIST',
                    createdAt: { gte: startOfDay, lte: endOfDay }
                }
            });
            const activeSubscriptions = await this.prisma.subscription.count({
                where: { status: { in: ['ACTIVE', 'TRIALING'] } }
            });
            const previousMetric = await this.prisma.dailyMetric.findFirst({
                orderBy: { date: 'desc' },
                take: 1
            });
            let revenueGrowth = 0;
            if (previousMetric && Number(previousMetric.totalRevenue) > 0) {
                revenueGrowth = ((dailyRevenue - Number(previousMetric.totalRevenue)) / Number(previousMetric.totalRevenue)) * 100;
            }
            await this.prisma.dailyMetric.create({
                data: {
                    date: startOfDay,
                    totalRevenue: dailyRevenue,
                    revenueGrowth,
                    totalUsers,
                    newUsers,
                    activeSubscriptions,
                    activeUsers: 0,
                    churnRate: 0
                }
            });
            this.logger.log(`Daily Metrics for ${startOfDay.toISOString()} calculated successfully.`);
            await this.cacheManager.del('admin_dashboard_stats');
        }
        catch (error) {
            this.logger.error('Error calculating daily metrics', error);
        }
    }
    async getAdminDashboardStats() {
        try {
            const cacheKey = 'admin_dashboard_stats';
            const cachedData = await this.cacheManager.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
            const latestMetric = await this.prisma.dailyMetric.findFirst({
                orderBy: { date: 'desc' }
            });
            let stats;
            if (!latestMetric) {
                this.logger.log('No latest metric found, calculating real-time stats...');
                stats = await this.calculateRealtimeStats();
            }
            else {
                this.logger.log('Latest metric found, using it as base...');
                stats = {
                    ...latestMetric,
                    totalRevenue: Number(latestMetric.totalRevenue),
                    revenueGrowth: Number(latestMetric.revenueGrowth || 0),
                };
            }
            const recentUsers = await this.prisma.nutritionist.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { account: true }
            });
            const activeSubscriptionsCount = await this.prisma.subscription.count({
                where: { status: { in: ['ACTIVE', 'TRIALING'] } }
            });
            const dashboardData = {
                overview: stats,
                activeSubscriptions: activeSubscriptionsCount,
                recentUsers: recentUsers.map(u => ({
                    id: u.id,
                    name: u.fullName,
                    email: u.account.email,
                    joinedAt: u.createdAt
                }))
            };
            await this.cacheManager.set(cacheKey, dashboardData, 600000);
            return dashboardData;
        }
        catch (error) {
            this.logger.error('Error in getAdminDashboardStats', error);
            throw error;
        }
    }
    async calculateRealtimeStats() {
        this.logger.log('Calculating realtime stats...');
        try {
            const totalUsers = await this.prisma.account.count({ where: { role: 'NUTRITIONIST' } });
            const revenueResult = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' }
            });
            return {
                totalUsers,
                totalRevenue: Number(revenueResult._sum.amount || 0),
                newUsers: 0,
                revenueGrowth: 0,
                activeSubscriptions: 0,
                activeUsers: 0,
                churnRate: 0
            };
        }
        catch (error) {
            this.logger.error('Error in calculateRealtimeStats', error);
            throw error;
        }
    }
    async forceCalculate() {
        await this.handleDailyMetrics();
        return { message: 'Calculation triggered' };
    }
};
exports.MetricsService = MetricsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsService.prototype, "handleDailyMetrics", null);
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map