import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class TagsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    findAll(limit?: number): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    }[]>;
    findOrCreate(name: string, nutritionistId?: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    } | null>;
    search(query: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    }[]>;
    remove(id: string, nutritionistId: string, role?: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    }>;
}
