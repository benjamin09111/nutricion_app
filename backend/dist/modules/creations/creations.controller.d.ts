import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
        name: string;
        tags: string[];
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    findAll(req: any, type?: string): Promise<{
        name: string;
        tags: string[];
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }[]>;
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
        name: string;
        tags: string[];
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
