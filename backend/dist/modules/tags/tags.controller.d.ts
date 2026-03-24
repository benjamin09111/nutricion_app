import { TagsService } from './tags.service';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(search?: string, limit?: string): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    }[]>;
    create(name: string, req: any): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    } | null>;
    remove(id: string, req: any): Promise<{
        name: string;
        nutritionistId: string | null;
        id: string;
    }>;
}
