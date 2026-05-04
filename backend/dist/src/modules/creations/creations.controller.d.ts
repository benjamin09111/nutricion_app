import { CreationsService } from './creations.service';
export declare class CreationsController {
    private readonly creationsService;
    constructor(creationsService: CreationsService);
    create(req: any, data: any): Promise<{
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
    findAll(req: any, type?: string): Promise<{
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
    getTags(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
    delete(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
