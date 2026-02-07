import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    /**
     * CRON JOB: Calculate daily metrics
     * Runs every day at midnight (00:00)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyMetrics() {
        this.logger.log('Running Daily Metrics Calculation Job...');

        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
            const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

            // 1. Calculate Revenue (Total Payments completed yesterday)
            const revenueResult = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: startOfDay, lte: endOfDay }
                }
            });
            const dailyRevenue = Number(revenueResult._sum.amount || 0);

            // 2. Count Users
            const totalUsers = await this.prisma.account.count({ where: { role: 'NUTRITIONIST' } });
            const newUsers = await this.prisma.account.count({
                where: {
                    role: 'NUTRITIONIST',
                    createdAt: { gte: startOfDay, lte: endOfDay }
                }
            });

            // 3. Count Active Subscriptions (Status ACTIVE or TRIALING)
            const activeSubscriptions = await this.prisma.subscription.count({
                where: { status: { in: ['ACTIVE', 'TRIALING'] } }
            });

            // 4. Calculate Growth vs Previous Day (for Revenue)
            const previousMetric = await this.prisma.dailyMetric.findFirst({
                orderBy: { date: 'desc' },
                take: 1
            });

            let revenueGrowth = 0;
            if (previousMetric && Number(previousMetric.totalRevenue) > 0) {
                revenueGrowth = ((dailyRevenue - Number(previousMetric.totalRevenue)) / Number(previousMetric.totalRevenue)) * 100;
            }

            // 5. Store Metric
            await this.prisma.dailyMetric.create({
                data: {
                    date: startOfDay,
                    totalRevenue: dailyRevenue,
                    revenueGrowth,
                    totalUsers,
                    newUsers,
                    activeSubscriptions,
                    // TODO: Implement Active Users Logic (e.g. login in last 24h)
                    activeUsers: 0,
                    churnRate: 0 // Placeholder until we have Churn Logic
                }
            });

            this.logger.log(`Daily Metrics for ${startOfDay.toISOString()} calculated successfully.`);

            // Invalidate Cache
            await this.cacheManager.del('admin_dashboard_stats');

        } catch (error) {
            this.logger.error('Error calculating daily metrics', error);
        }
    }

    /**
     * Get Aggregated Stats for Dashboard (Cached)
     */
    async getAdminDashboardStats() {
        try {
            const cacheKey = 'admin_dashboard_stats';
            const cachedData = await this.cacheManager.get(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            // Fetch latest metric
            const latestMetric = await this.prisma.dailyMetric.findFirst({
                orderBy: { date: 'desc' }
            });

            // If no metrics exist yet (e.g. new system), calculate on the fly for "Today"
            let stats;
            if (!latestMetric) {
                this.logger.log('No latest metric found, calculating real-time stats...');
                stats = await this.calculateRealtimeStats();
            } else {
                this.logger.log('Latest metric found, using it as base...');
                stats = {
                    ...latestMetric,
                    totalRevenue: Number(latestMetric.totalRevenue),
                    revenueGrowth: Number(latestMetric.revenueGrowth || 0),
                };
            }

            // Fetch "Recent Activity" (Live, limit 5)
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

            // Cache for 10 minutes
            await this.cacheManager.set(cacheKey, dashboardData, 600000);

            return dashboardData;
        } catch (error) {
            this.logger.error('Error in getAdminDashboardStats', error);
            throw error;
        }
    }

    /**
     * Fallback for real-time calculation if no daily metrics exist
     */
    private async calculateRealtimeStats() {
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
        } catch (error) {
            this.logger.error('Error in calculateRealtimeStats', error);
            throw error;
        }
    }

    // Manual trigger for testing
    async forceCalculate() {
        await this.handleDailyMetrics();
        return { message: 'Calculation triggered' };
    }
}
