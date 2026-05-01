import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class CreationsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, data: any): Promise<{
        wasCreated: boolean;
        id: string;
        name: string;
        type: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    } | {
        wasCreated: boolean;
        id: string;
        nutritionistId: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        id: string;
        nutritionistId: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        id: string;
        nutritionistId: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
