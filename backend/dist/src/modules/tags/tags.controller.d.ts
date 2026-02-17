import { TagsService } from './tags.service';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(search?: string): Promise<{
        id: string;
        name: string;
    }[]>;
    create(name: string): Promise<{
        id: string;
        name: string;
    } | null>;
}
