import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';

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

export function loadDefaultResources(): SeedResource[] {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Default resources file not found at ${jsonPath}`);
  }

  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as SeedResource[];
}

export async function replaceDefaultResources(
  prisma: PrismaClient | Prisma.TransactionClient,
) {
  const defaultResources = loadDefaultResources();

  const deleted = await prisma.resource.deleteMany();
  console.log(`🧹 Deleted ${deleted.count} existing resources.`);

  if (!defaultResources.length) {
    console.log('ℹ️ No resources found in JSON. Database was left empty on purpose.');
    return;
  }

  const result = await prisma.resource.createMany({
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
}
