import { PrismaService } from '../../prisma/prisma.service';
import type { Cache } from 'cache-manager';
export declare class MetricsService {
    private prisma;
    private cacheManager;
    private readonly logger;
    constructor(prisma: PrismaService, cacheManager: Cache);
    handleDailyMetrics(): Promise<void>;
    getAdminDashboardStats(): Promise<{}>;
    private calculateRealtimeStats;
    forceCalculate(): Promise<{
        message: string;
    }>;
}
