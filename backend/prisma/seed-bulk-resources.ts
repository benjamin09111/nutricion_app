import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const jsonPath = path.resolve(__dirname, '../../data/seed_resources.json');

async function seed() {
    console.log('🌱 Starting bulk resource seed...');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found at: ${jsonPath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const { resources } = data;

    // 1. Create/Update the FAQ section
    console.log('📦 Ensuring "Preguntas frecuentes" section exists...');
    await prisma.resourceSection.upsert({
        where: { slug: 'faq' },
        update: {
            name: 'Preguntas frecuentes',
            icon: 'HelpCircle',
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
        create: {
            name: 'Preguntas frecuentes',
            slug: 'faq',
            icon: 'HelpCircle',
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        }
    });

    // 2. Create the resources
    console.log(`📑 Seeding ${resources.length} resources...`);
    let count = 0;
    for (const res of resources) {
        // We skip resources that already exist by title to avoid duplicates
        const existing = await prisma.resource.findFirst({
            where: { 
                title: res.title,
                category: res.category
            }
        });

        if (!existing) {
            await prisma.resource.create({
                data: {
                    ...res,
                    isPublic: true
                }
            });
            count++;
        }
    }

    console.log(`✅ Seed completed. ${count} new resources added.`);
}

seed()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
