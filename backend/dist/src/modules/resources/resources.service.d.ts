import { PrismaService } from '../../prisma/prisma.service';
export declare class ResourcesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(nutritionistId: string, isAdmin: boolean): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(nutritionistId: string | null, data: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
        images?: any;
        isPublic?: boolean;
    }): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, nutritionistId: string, isAdmin: boolean, data: {
        title?: string;
        content?: string;
        category?: string;
        tags?: string[];
        images?: any;
        isPublic?: boolean;
    }): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, nutritionistId: string, isAdmin: boolean): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
