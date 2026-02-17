import { ResourcesService } from './resources.service';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    findAll(req: any): Promise<{
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
    create(req: any, data: any): Promise<{
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
    update(id: string, req: any, data: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
