import { PrismaService } from '../../prisma/prisma.service';
export declare class SubstitutesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByNutritionist(nutritionistId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    upsert(nutritionistId: string, content: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
