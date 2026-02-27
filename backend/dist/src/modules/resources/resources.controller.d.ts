import { ResourcesService } from './resources.service';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    findAll(req: any): Promise<{
        tags: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        isPublic: boolean;
        category: string;
        title: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findOne(id: string): Promise<{
        tags: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        isPublic: boolean;
        category: string;
        title: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    create(req: any, data: any): Promise<{
        tags: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        isPublic: boolean;
        category: string;
        title: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, req: any, data: any): Promise<{
        tags: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        isPublic: boolean;
        category: string;
        title: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, req: any): Promise<{
        tags: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string | null;
        content: string;
        isPublic: boolean;
        category: string;
        title: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
