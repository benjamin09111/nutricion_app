import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
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
    findAll(req: any, type?: string): Promise<{
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
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
