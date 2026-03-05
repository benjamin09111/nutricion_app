import { PrismaService } from '../../prisma/prisma.service';
export declare class ResourcesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(nutritionistId: string, isAdmin: boolean): Promise<{
        isMine: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        tags: string[];
        isPublic: boolean;
        category: string;
        title: string;
        sources: string | null;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        tags: string[];
        isPublic: boolean;
        category: string;
        title: string;
        sources: string | null;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    create(nutritionistId: string | null, data: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
        images?: any;
        isPublic?: boolean;
        sources?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        tags: string[];
        isPublic: boolean;
        category: string;
        title: string;
        sources: string | null;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, nutritionistId: string, isAdmin: boolean, data: {
        title?: string;
        content?: string;
        category?: string;
        tags?: string[];
        images?: any;
        isPublic?: boolean;
        sources?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        tags: string[];
        isPublic: boolean;
        category: string;
        title: string;
        sources: string | null;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, nutritionistId: string, isAdmin: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        tags: string[];
        isPublic: boolean;
        category: string;
        title: string;
        sources: string | null;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
