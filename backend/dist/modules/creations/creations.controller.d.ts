import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
        name: string;
        tags: string[];
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findAll(req: any, type?: string): Promise<{
        name: string;
        tags: string[];
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
        name: string;
        tags: string[];
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
