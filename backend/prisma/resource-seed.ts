import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';

const jsonPath = path.resolve(__dirname, '../src/data/default-resources.json');
const restrictionResourcesPath = path.resolve(
  __dirname,
  '../../data/restriction_resources.json',
);

type SeedResource = {
  id?: string;
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

export function loadRestrictionResources(): SeedResource[] {
  if (!fs.existsSync(restrictionResourcesPath)) {
    throw new Error(
      `Restriction resources file not found at ${restrictionResourcesPath}`,
    );
  }

  return JSON.parse(
    fs.readFileSync(restrictionResourcesPath, 'utf-8'),
  ) as SeedResource[];
}

const toSystemResourceData = (resource: SeedResource) => ({
  title: resource.title,
  content: resource.content,
  category: resource.category,
  tags: resource.tags || [],
  sources: resource.sources,
  format: resource.format || 'HTML',
  fileUrl: resource.fileUrl || null,
  isPublic: true,
  nutritionistId: null,
});

export async function replaceDefaultResources(
  prisma: PrismaClient | Prisma.TransactionClient,
) {
  const defaultResources = [
    ...loadDefaultResources(),
    ...loadRestrictionResources(),
  ];

  let count = 0;
  for (const resource of defaultResources) {
    const data = toSystemResourceData(resource);
    if (resource.id) {
      await (prisma as PrismaClient).resource.upsert({
        where: { id: resource.id },
        update: data,
        create: { id: resource.id, ...data },
      });
      count++;
    } else {
      const existing = await (prisma as PrismaClient).resource.findFirst({
        where: { title: resource.title, nutritionistId: null },
      });
      if (!existing) {
        await (prisma as PrismaClient).resource.create({ data });
        count++;
      }
    }
  }

  console.log(`✅ Seed completed. Synced ${count} default resources non-destructively.`);
}

export async function upsertRestrictionResources(
  prisma: PrismaClient | Prisma.TransactionClient,
) {
  const restrictionResources = loadRestrictionResources();

  for (const resource of restrictionResources) {
    if (!resource.id) {
      throw new Error('Restriction resources require a stable id.');
    }

    await prisma.resource.upsert({
      where: { id: resource.id },
      create: { id: resource.id, ...toSystemResourceData(resource) },
      update: toSystemResourceData(resource),
    });
  }

  console.log(
    `✅ Restriction resources synced. Processed ${restrictionResources.length} system resources.`,
  );
}
