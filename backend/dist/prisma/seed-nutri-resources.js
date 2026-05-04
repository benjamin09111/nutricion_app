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
//# sourceMappingURL=seed-nutri-resources.js.map