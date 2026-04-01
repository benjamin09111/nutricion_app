import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const jsonPath = path.resolve(__dirname, '../../data/seed_resources.json');

async function cleanup() {
    console.log('🧹 Starting resources cleanup...');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Seed file not found at: ${jsonPath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const seedTitles = data.resources.map((r: any) => r.title);

    console.log(`🔍 Keeping ${seedTitles.length} resources from seed.`);

    // Delete all resources whose title is NOT in the seed file
    const result = await prisma.resource.deleteMany({
        where: {
            title: {
                notIn: seedTitles
            }
        }
    });

    console.log(`✅ Cleanup completed. Deleted ${result.count} "trash" resources.`);
}

cleanup()
    .catch(e => {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
