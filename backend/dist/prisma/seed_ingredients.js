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
async function main() {
    console.log('🔄 Start seeding ingredients + recipes...');
    console.log('🗑️ Cleaning up existing ingredients...');
    try {
        await prisma.ingredientPreference.deleteMany({});
        await prisma.ingredient.deleteMany({});
        console.log('✅ Existing ingredients deleted.');
    }
    catch (error) {
        console.error('⚠️ Error cleaning up:', error);
    }
    const categories = await prisma.ingredientCategory.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const csvFiles = ['ingredients.csv', 'recipes.csv'];
    const ingredientsData = [];
    let errorCount = 0;
    for (const fileName of csvFiles) {
        const csvPath = path.resolve(__dirname, `../../${fileName}`);
        console.log(`📂 Reading CSV from: ${csvPath}`);
        if (!fs.existsSync(csvPath)) {
            console.warn(`⚠️ File not found: ${csvPath}`);
            continue;
        }
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        console.log(`📊 Found ${lines.length} records in ${fileName}.`);
        for (const line of lines) {
            const cols = line.split(',');
            if (cols.length < 10)
                continue;
            const name = cols[0].trim();
            const csvCategory = cols[1].trim();
            const calories = parseFloat(cols[2]) || 0;
            const proteins = parseFloat(cols[3]) || 0;
            const carbs = parseFloat(cols[4]) || 0;
            const lipids = parseFloat(cols[5]) || 0;
            const sugars = parseFloat(cols[6]) || 0;
            const fiber = parseFloat(cols[7]) || 0;
            const sodium = parseFloat(cols[8]) || 0;
            const unit = cols[9].trim();
            const amount = parseFloat(cols[10]) || 100;
            const price = parseInt(cols[11]) || 0;
            const categoryId = categoryMap.get(csvCategory);
            if (!categoryId) {
                console.warn(`⚠️ Category not found for "${name}": ${csvCategory}`);
                errorCount++;
                continue;
            }
            ingredientsData.push({
                name,
                categoryId,
                calories,
                proteins,
                carbs,
                lipids,
                sugars,
                fiber,
                sodium,
                unit,
                amount,
                price,
                isPublic: true,
                verified: true
            });
        }
    }
    if (ingredientsData.length > 0) {
        console.log(`🚀 Inserting ${ingredientsData.length} total records...`);
        try {
            const result = await prisma.ingredient.createMany({
                data: ingredientsData,
                skipDuplicates: true,
            });
            console.log(`✅ Successfully inserted ${result.count} records using createMany.`);
        }
        catch (e) {
            console.error(`❌ Error in bulk insert:`, e);
            throw e;
        }
    }
    console.log(`\n🎉 Process Finished!`);
    console.log(`✅ Total processed: ${ingredientsData.length}`);
    console.log(`❌ Skipped (No Category/Invalid): ${errorCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_ingredients.js.map