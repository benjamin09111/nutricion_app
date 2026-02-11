import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
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
    findAll(req: any, type?: string): Promise<{
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
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
