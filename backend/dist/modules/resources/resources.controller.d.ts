import { ResourcesService } from './resources.service';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    findAll(req: any): Promise<({
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
    getSections(req: any): Promise<{
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
    createSection(req: any, data: any): Promise<{
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
    create(req: any, data: any): Promise<{
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
    resolveVariables(data: {
        content: string;
        inputs: Record<string, string>;
    }): {
        resolvedContent: string;
    };
    update(id: string, req: any, data: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
