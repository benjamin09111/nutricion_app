import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';

loadPrismaEnv();

const prisma = new PrismaClient();

const jsonPath = path.resolve(__dirname, '../src/data/default-resources.json');

type SeedResource = {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    sources?: string;
    format?: string;
    fileUrl?: string | null;
};

async function seed() {
    console.log('🌱 Replacing all resources from default-resources.json...');

    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Default resources file not found at ${jsonPath}`);
    }

    const defaultResources = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as SeedResource[];

    await prisma.$transaction(async (tx) => {
        const deleted = await tx.resource.deleteMany();
        console.log(`🧹 Deleted ${deleted.count} existing resources.`);

        if (!defaultResources.length) {
            console.log('ℹ️ No resources found in JSON. Database was left empty on purpose.');
            return;
        }

        const result = await tx.resource.createMany({
            data: defaultResources.map((resource) => ({
                title: resource.title,
                content: resource.content,
                category: resource.category,
                tags: resource.tags || [],
                sources: resource.sources,
                format: resource.format || 'HTML',
                fileUrl: resource.fileUrl || null,
                isPublic: true,
                nutritionistId: null,
            })),
        });

        console.log(`✅ Seed completed. Inserted ${result.count} default resources.`);
    });
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
