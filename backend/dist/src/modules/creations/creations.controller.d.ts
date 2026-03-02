import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
    }>;
    findAll(req: any, type?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
    }[]>;
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        type: string;
        format: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tags: string[];
    }>;
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
