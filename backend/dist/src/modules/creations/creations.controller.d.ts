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
        tags: string[];
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: import("@prisma/client/runtime/library").JsonValue;
        format: string;
    }>;
    findAll(req: any, type?: string): Promise<{
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
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
