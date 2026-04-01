import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const jsonPath = path.resolve(__dirname, '../../data/nutri_resources.json');

async function seed() {
    console.log('🌱 Starting nutri resource seed...');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found at: ${jsonPath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const { resources } = data;

    console.log(`📑 Seeding ${resources.length} resources for specific nutritionists...`);
    let count = 0;
    for (const res of resources) {
        // We skip resources that already exist by title to avoid duplicates
        const existing = await prisma.resource.findFirst({
            where: { 
                title: res.title,
                nutritionistId: res.nutritionistId
            }
        });

        if (!existing) {
            await prisma.resource.create({
                data: {
                    ...res,
                    isPublic: res.isPublic ?? false
                }
            });
            count++;
        }
    }

    console.log(`✅ Seed completed. ${count} new private resources added.`);
}

seed()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
