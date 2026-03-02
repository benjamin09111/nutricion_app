import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class MetricsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }[]>;
    findOrCreate(data: {
        name: string;
        unit: string;
        key: string;
        icon?: string;
        color?: string;
    }, nutritionistId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
    search(query: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }[]>;
    remove(id: string, nutritionistId: string, role?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
}
