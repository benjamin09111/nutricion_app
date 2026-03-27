import { ResourcesService } from './resources.service';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    findAll(req: any): Promise<({
        isMine: boolean;
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        fileUrl: string | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    })[]>;
    getSections(req: any): Promise<{
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        icon: string | null;
        color: string | null;
        bg: string | null;
    }[]>;
    createSection(req: any, data: any): Promise<{
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        icon: string | null;
        color: string | null;
        bg: string | null;
    }>;
    findOne(id: string): Promise<({
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        fileUrl: string | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    }) | null>;
    create(req: any, data: any): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        fileUrl: string | null;
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
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        fileUrl: string | null;
        sources: string | null;
    } & {
        variablePlaceholders: string[];
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        nutritionistId: string | null;
        title: string;
        content: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        format: string;
        fileUrl: string | null;
        sources: string | null;
    }>;
    extractText(data: {
        fileUrl: string;
    }): Promise<{
        text: any;
        html: string;
        pages: any;
        info: any;
    }>;
}
