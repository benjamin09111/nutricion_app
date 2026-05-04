import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class CreationsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, data: any): Promise<{
        wasCreated: boolean;
        id: string;
        tags: string[];
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        content: import("@prisma/client/runtime/library").JsonValue;
    } | {
        wasCreated: boolean;
        id: string;
        tags: string[];
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        id: string;
        tags: string[];
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        id: string;
        tags: string[];
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
