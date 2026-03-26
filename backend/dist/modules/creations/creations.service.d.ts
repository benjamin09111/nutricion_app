import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class CreationsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, data: any): Promise<{
        tags: string[];
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        tags: string[];
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        tags: string[];
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
