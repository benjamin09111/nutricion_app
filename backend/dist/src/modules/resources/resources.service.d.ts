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
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
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
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
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
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
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
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
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
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    }>;
    getSections(nutritionistId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        slug: string;
        icon: string | null;
        color: string | null;
        bg: string | null;
    }[]>;
    createSection(nutritionistId: string | null, data: {
        name: string;
        icon?: string;
        color?: string;
        bg?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        slug: string;
        icon: string | null;
        color: string | null;
        bg: string | null;
    }>;
}
