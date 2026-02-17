import { SubstitutesService } from './substitutes.service';
export declare class SubstitutesController {
    private readonly substitutesService;
    constructor(substitutesService: SubstitutesService);
    findOne(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    upsert(req: any, body: {
        content: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
