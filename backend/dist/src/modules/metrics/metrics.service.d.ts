import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class MetricsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    findAll(): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }[]>;
    findOrCreate(data: {
        name: string;
        unit: string;
        key: string;
        icon?: string;
        color?: string;
    }, nutritionistId?: string): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }>;
    search(query: string): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }[]>;
    remove(id: string, nutritionistId: string, role?: string): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }>;
}
