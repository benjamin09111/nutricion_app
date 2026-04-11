import { TagsService } from './tags.service';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(search?: string, limit?: string): Promise<{
        name: string;
        id: string;
        nutritionistId: string | null;
    }[]>;
    create(name: string, req: any): Promise<{
        name: string;
        id: string;
        nutritionistId: string | null;
    } | null>;
    remove(id: string, req: any): Promise<{
        name: string;
        id: string;
        nutritionistId: string | null;
    }>;
}
