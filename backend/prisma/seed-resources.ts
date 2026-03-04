import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import * as fs from 'fs';
import * as path from 'path';

const jsonPath = path.resolve(__dirname, '../src/data/default-resources.json');
const defaultResources = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

async function seed() {
    console.log('🌱 Seeding default resources...');
    for (const res of defaultResources) {
        await prisma.resource.create({
            data: {
                ...res,
                isPublic: true
            }
        });
    }
    console.log('✅ Default resources seeded.');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
