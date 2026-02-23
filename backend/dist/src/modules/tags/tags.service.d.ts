import { PrismaService } from '../../prisma/prisma.service';
export declare class TagsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
    }[]>;
    findOrCreate(name: string): Promise<{
        id: string;
        name: string;
    } | null>;
    search(query: string): Promise<{
        id: string;
        name: string;
    }[]>;
    remove(id: string): Promise<{
        id: string;
        name: string;
    }>;
}
