import { PrismaService } from '../../prisma/prisma.service';
export declare class ResourcesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private extractVariables;
    private enrichWithVariables;
    resolveVariables(content: string, inputs: Record<string, string>): string;
    findAll(nutritionistId: string, isAdmin: boolean): Promise<({
        isMine: boolean;
        category: string;
        tags: string[];
        isPublic: boolean;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    })[]>;
    findOne(id: string): Promise<({
        category: string;
        tags: string[];
        isPublic: boolean;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    }) | null>;
    create(nutritionistId: string | null, data: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
        images?: any;
        isPublic?: boolean;
        sources?: string;
    }): Promise<{
        category: string;
        tags: string[];
        isPublic: boolean;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
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
        category: string;
        tags: string[];
        isPublic: boolean;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    }>;
    remove(id: string, nutritionistId: string, isAdmin: boolean): Promise<{
        category: string;
        tags: string[];
        isPublic: boolean;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        sources: string | null;
    }>;
    getSections(nutritionistId: string): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        slug: string;
        bg: string | null;
    }[]>;
    createSection(nutritionistId: string | null, data: {
        name: string;
        icon?: string;
        color?: string;
        bg?: string;
    }): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        slug: string;
        bg: string | null;
    }>;
}
