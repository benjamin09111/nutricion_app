"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
let RecipesService = class RecipesService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async getNutritionistId(accountId) {
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId },
            select: { id: true }
        });
        if (!nutritionist)
            throw new common_1.NotFoundException('Nutritionist profile not found');
        return nutritionist.id;
    }
    async create(userId, createDto) {
        console.log('[RecipesService.create] userId:', userId, 'createDto:', JSON.stringify(createDto, null, 2));
        try {
            const nutritionistId = await this.getNutritionistId(userId);
            console.log('[RecipesService.create] nutritionistId:', nutritionistId);
            const { ingredients, tags, mealSection, customIngredientNames, customIngredients, ...data } = createDto;
            const metadata = (tags?.length || mealSection || customIngredientNames?.length || customIngredients?.length)
                ? JSON.parse(JSON.stringify({ tags: tags || [], mealSection: mealSection || null, customIngredientNames: customIngredientNames || [], customIngredients: customIngredients || [] }))
                : undefined;
            const portions = data.portions ?? 1;
            let calcMacros = {
                calories: data.calories ?? 0,
                proteins: data.proteins ?? 0,
                carbs: data.carbs ?? 0,
                lipids: data.lipids ?? 0,
                fiber: 0,
                sodium: 0
            };
            if (ingredients && ingredients.length > 0 && (data.calories == null || data.proteins == null || data.fiber == null || data.sodium == null)) {
                const ingredientIds = ingredients.map(i => i.ingredientId);
                const dbIngredients = await this.prisma.ingredient.findMany({
                    where: { id: { in: ingredientIds } }
                });
                let totalCalories = 0;
                let totalProteins = 0;
                let totalCarbs = 0;
                let totalLipids = 0;
                let totalFiber = 0;
                let totalSodium = 0;
                ingredients.forEach(ing => {
                    const dbIng = dbIngredients.find(d => d.id === ing.ingredientId);
                    if (dbIng) {
                        const factor = ing.amount / 100;
                        totalCalories += dbIng.calories * factor;
                        totalProteins += dbIng.proteins * factor;
                        totalCarbs += dbIng.carbs * factor;
                        totalLipids += dbIng.lipids * factor;
                        totalFiber += (dbIng.fiber ?? 0) * factor;
                        totalSodium += (dbIng.sodium ?? 0) * factor;
                    }
                });
                if (data.calories == null)
                    calcMacros.calories = parseFloat((totalCalories / portions).toFixed(2));
                if (data.proteins == null)
                    calcMacros.proteins = parseFloat((totalProteins / portions).toFixed(2));
                if (data.carbs == null)
                    calcMacros.carbs = parseFloat((totalCarbs / portions).toFixed(2));
                if (data.lipids == null)
                    calcMacros.lipids = parseFloat((totalLipids / portions).toFixed(2));
                if (data.fiber == null)
                    calcMacros.fiber = parseFloat((totalFiber / portions).toFixed(2));
                if (data.sodium == null)
                    calcMacros.sodium = parseFloat((totalSodium / portions).toFixed(2));
            }
            const recipe = await this.prisma.recipe.create({
                data: {
                    name: data.name,
                    description: data.description,
                    preparation: data.preparation,
                    imageUrl: data.imageUrl,
                    portionSize: data.portionSize,
                    portions,
                    nutritionist: { connect: { id: nutritionistId } },
                    calories: data.calories ?? calcMacros.calories,
                    proteins: data.proteins ?? calcMacros.proteins,
                    carbs: data.carbs ?? calcMacros.carbs,
                    lipids: data.lipids ?? calcMacros.lipids,
                    fiber: data.fiber ?? calcMacros.fiber,
                    sodium: data.sodium ?? calcMacros.sodium,
                    isPublic: data.isPublic ?? false,
                    metadata: metadata,
                    ingredients: ingredients?.length
                        ? {
                            create: ingredients.map(ing => ({
                                ingredientId: ing.ingredientId,
                                amount: ing.amount,
                                unit: ing.unit,
                                brandSuggestion: ing.brandSuggestion,
                                isMain: ing.isMain ?? true
                            }))
                        } : undefined
                },
                include: {
                    ingredients: {
                        include: { ingredient: true }
                    }
                }
            });
            await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'recipes');
            await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
            await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
            await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
            console.log('[RecipesService.create] Success, recipe id:', recipe.id);
            return recipe;
        }
        catch (err) {
            console.error('[RecipesService.create] Error:', err);
            throw err;
        }
    }
    async findAll(userId) {
        try {
            const nutritionistId = await this.getNutritionistId(userId);
            const recipes = await this.prisma.recipe.findMany({
                where: {
                    OR: [
                        { isPublic: true },
                        { nutritionistId }
                    ]
                },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } },
                    ingredients: {
                        include: {
                            ingredient: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r) => ({ ...r, isMine: r.nutritionistId === nutritionistId }));
        }
        catch (error) {
            const recipes = await this.prisma.recipe.findMany({
                where: { isPublic: true },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r) => ({ ...r, isMine: false }));
        }
    }
    async findOne(id, userId) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                },
                nutritionist: true
            }
        });
        if (!recipe)
            throw new common_1.NotFoundException('Recipe not found');
        if (!recipe.isPublic && recipe.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return recipe;
    }
    async update(id, userId, userRole, updateDto) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);
        const isAdmin = userRole && ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(userRole);
        if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('Cannot edit public or others recipes');
        }
        const { ingredients, tags, mealSection, customIngredientNames, customIngredients, ...data } = updateDto;
        const metadata = (tags?.length || mealSection || customIngredientNames?.length || customIngredients?.length)
            ? JSON.parse(JSON.stringify({ tags: tags || [], mealSection: mealSection || null, customIngredientNames: customIngredientNames || [], customIngredients: customIngredients || [] }))
            : null;
        const updateData = {
            name: data.name,
            description: data.description,
            preparation: data.preparation,
            imageUrl: data.imageUrl,
            portionSize: data.portionSize,
            portions: data.portions ?? 1,
            calories: data.calories,
            proteins: data.proteins,
            carbs: data.carbs,
            lipids: data.lipids,
            fiber: data.fiber ?? undefined,
            sodium: data.sodium ?? undefined,
            isPublic: data.isPublic,
            metadata: metadata ?? undefined
        };
        if (ingredients) {
            updateData.ingredients = {
                deleteMany: {},
                create: ingredients.map(ing => ({
                    ingredientId: ing.ingredientId,
                    amount: ing.amount,
                    unit: ing.unit,
                    brandSuggestion: ing.brandSuggestion,
                    isMain: ing.isMain ?? true
                }))
            };
        }
        const updated = await this.prisma.recipe.update({
            where: { id },
            data: updateData,
            include: { ingredients: true }
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
        return updated;
    }
    async estimateMacros(dto) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new common_1.BadRequestException('Configura tu API key de OpenAI para usar esta función.');
        }
        const prompt = [
            'Eres un nutricionista. Estima los valores nutricionales por porción para un plato con los siguientes ingredientes.',
            'Responde SOLO un JSON válido con la forma: {"calories": número, "proteins": número, "carbs": número, "lipids": número}',
            'Los valores deben ser por una porción razonable del plato completo.',
            `Ingredientes: ${JSON.stringify(dto.ingredientNames)}`,
        ].join('\n');
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: 'Eres un asistente nutricional. Responde solo JSON.' },
                        { role: 'user', content: prompt },
                    ],
                }),
            });
            if (!response.ok) {
                throw new common_1.BadRequestException('Configura tu API key de OpenAI para usar esta función.');
            }
            const json = (await response.json());
            const content = json.choices?.[0]?.message?.content;
            if (!content) {
                throw new common_1.BadRequestException('No se pudo obtener la respuesta de la IA.');
            }
            const parsed = JSON.parse(content);
            return {
                calories: Math.round(parsed.calories ?? 0),
                proteins: Math.round(parsed.proteins ?? 0),
                carbs: Math.round(parsed.carbs ?? 0),
                lipids: Math.round(parsed.lipids ?? 0),
            };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('Configura tu API key de OpenAI para usar esta función.');
        }
    }
    async remove(id, userId, userRole) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);
        const isAdmin = userRole && ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(userRole);
        if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('Cannot delete public or others recipes');
        }
        const deleted = await this.prisma.recipe.delete({ where: { id } });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
        return deleted;
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map