import { PrismaService } from '../../prisma/prisma.service';
export declare class CreationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, data: any): Promise<{
        id: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
        id: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        id: string;
        name: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    delete(id: string, nutritionistId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAvailableTags(nutritionistId: string): Promise<any[]>;
}
