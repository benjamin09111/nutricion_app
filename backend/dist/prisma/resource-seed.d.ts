import { PrismaClient, Prisma } from '@prisma/client';
type SeedResource = {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    sources?: string;
    format?: string;
    fileUrl?: string | null;
};
export declare function loadDefaultResources(): SeedResource[];
export declare function replaceDefaultResources(prisma: PrismaClient | Prisma.TransactionClient): Promise<void>;
export {};
