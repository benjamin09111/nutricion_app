import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class CreationsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, data: any): Promise<{
        wasCreated: boolean;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        content: import("@prisma/client/runtime/library").JsonValue;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
    } | {
        wasCreated: boolean;
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
