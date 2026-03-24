import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class TagsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    findAll(limit?: number): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    }[]>;
    findOrCreate(name: string, nutritionistId?: string): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    } | null>;
    search(query: string): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    }[]>;
    remove(id: string, nutritionistId: string, role?: string): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    }>;
}
