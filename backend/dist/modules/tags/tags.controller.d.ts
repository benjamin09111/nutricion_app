import { TagsService } from './tags.service';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(search?: string, limit?: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    }[]>;
    create(name: string, req: any): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    } | null>;
    remove(id: string, req: any): Promise<{
        id: string;
        name: string;
        nutritionistId: string | null;
    }>;
}
