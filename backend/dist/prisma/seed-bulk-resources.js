"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
const jsonPath = path.resolve(__dirname, '../../data/seed_resources.json');
async function seed() {
    console.log('🌱 Starting bulk resource seed...');
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found at: ${jsonPath}`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const { resources } = data;
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
    console.log(`📑 Seeding ${resources.length} resources...`);
    let count = 0;
    for (const res of resources) {
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
//# sourceMappingURL=seed-bulk-resources.js.map