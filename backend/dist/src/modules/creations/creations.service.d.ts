import { PrismaService } from '../../prisma/prisma.service';
export declare class CreationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        tags: string[];
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        tags: string[];
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        tags: string[];
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
