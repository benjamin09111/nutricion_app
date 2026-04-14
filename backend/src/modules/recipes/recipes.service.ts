import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AiFillPayload, AiFillRecipesDto } from './dto/ai-fill-recipes.dto';

import { CacheService } from '../../common/services/cache.service';
import { RECIPES_AI_PROMPTS } from './recipes-ai-prompts';

type AiRecipeOutput = {
    slotId: string;
    mealSection: string;
    title: string;
    description: string;
    preparation: string;
    recommendedPortion: string;
    complexity: 'simple' | 'elaborada';
    protein: number;
    calories: number;
    carbs: number;
    fats: number;
    ingredients: string[];
    mainIngredients: string[];
};

type AiReplacementGuide = {
    mealSection: string;
    suggestions: string[];
};

type AiMetaResponse = {
    note: string;
    replacementGuide: AiReplacementGuide[];
};

type AiFillDayResponse = {
    recipes: AiRecipeOutput[];
    meta: AiMetaResponse;
};

type AiFillWeekResponse = {
    days: Array<{
        day: string;
        recipes: AiRecipeOutput[];
    }>;
    meta: AiMetaResponse;
};

@Injectable()
export class RecipesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    private async getNutritionistId(accountId: string): Promise<string> {
        // Assuming accountId IS the userId passed from controller (which is true now)
        // But wait, the controller passes req.user.id which IS the User ID.
        // We need the Nutritionist ID.
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId },
            select: { id: true }
        });
        if (!nutritionist) throw new NotFoundException('Nutritionist profile not found');
        return nutritionist.id;
    }

    private normalizeFoodName(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private normalizeMealSection(value?: string): string {
        return this.normalizeFoodName(value || '');
    }

    private isStrictMealSection(mealSection?: string): boolean {
        const normalized = this.normalizeMealSection(mealSection);
        return ['desayuno', 'almuerzo', 'cena', 'once'].includes(normalized);
    }

    private buildAiPrompt(payload: AiFillPayload): string {
        const scopePrompt =
            payload.scope === 'week' ? RECIPES_AI_PROMPTS.week : RECIPES_AI_PROMPTS.day;

        return [scopePrompt, JSON.stringify(payload)].join('\n');
    }

    private extractJsonFromResponse(rawContent: string): string {
        const trimmed = rawContent.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return trimmed;
        }

        const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch?.[1]) {
            return fencedMatch[1].trim();
        }

        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.slice(firstBrace, lastBrace + 1);
        }

        throw new BadRequestException('La IA no devolvió un JSON válido.');
    }

    private parseAiResponse(rawContent: string): AiFillDayResponse | AiFillWeekResponse {
        const jsonContent = this.extractJsonFromResponse(rawContent);
        return JSON.parse(jsonContent) as AiFillDayResponse | AiFillWeekResponse;
    }

    private validateAiRecipe(
        recipe: AiRecipeOutput,
        slotMealSection: string,
        allowedFoods: Set<string>,
        allowFlexibleExternalFoods: boolean,
    ) {
        if (!recipe.slotId || !recipe.title || !recipe.mealSection || !recipe.recommendedPortion?.trim()) {
            throw new BadRequestException('La IA devolvió una receta incompleta.');
        }

        const normalizedSlotMealSection = this.normalizeMealSection(slotMealSection);
        const normalizedRecipeMealSection = this.normalizeMealSection(recipe.mealSection);
        if (normalizedSlotMealSection !== normalizedRecipeMealSection) {
            throw new BadRequestException(`La IA devolvió una sección incompatible para ${recipe.slotId}.`);
        }

        const allIngredients = [...(recipe.ingredients || []), ...(recipe.mainIngredients || [])]
            .map((item) => this.normalizeFoodName(item))
            .filter(Boolean);

        const requiresStrictDietFoods = this.isStrictMealSection(recipe.mealSection);
        if (requiresStrictDietFoods || !allowFlexibleExternalFoods) {
            const invalidIngredient = allIngredients.find((ingredient) => !allowedFoods.has(ingredient));
            if (invalidIngredient) {
                throw new BadRequestException(
                    `La IA devolvió un ingrediente fuera de la dieta permitida: ${invalidIngredient}.`,
                );
            }
        }
    }

    private validateReplacementGuide(meta?: AiMetaResponse) {
        if (!meta) {
            throw new BadRequestException('La IA no devolvió metadata de guía.');
        }

        if (typeof meta.note !== 'string' || !meta.note.trim()) {
            throw new BadRequestException('La IA no devolvió la nota general requerida.');
        }

        if (!Array.isArray(meta.replacementGuide)) {
            throw new BadRequestException('La IA no devolvió replacementGuide válido.');
        }

        meta.replacementGuide.forEach((item) => {
            if (!item.mealSection || !Array.isArray(item.suggestions)) {
                throw new BadRequestException('La IA devolvió replacementGuide incompleto.');
            }
        });
    }

    private validateWeekVariety(
        response: AiFillWeekResponse,
        existingAssignments: AiFillPayload['existingAssignments'],
    ) {
        const orderedDays = response.days || [];
        let previousTitles: Set<string> | null = null;

        orderedDays.forEach((dayBlock, index) => {
            const currentTitles = new Set<string>(
                dayBlock.recipes.map((recipe) => this.normalizeFoodName(recipe.title)),
            );

            const fallbackPreviousTitles =
                index === 0
                    ? new Set<string>()
                    : new Set(
                        existingAssignments
                            .filter((assignment) => assignment.day === orderedDays[index - 1]?.day)
                            .map((assignment) => this.normalizeFoodName(assignment.title)),
                    );

            const titlesToCompare = previousTitles ?? fallbackPreviousTitles;
            const repeated = [...currentTitles].find((title) => titlesToCompare.has(title));
            if (repeated) {
                throw new BadRequestException(
                    `La IA repitió un plato en días consecutivos: ${repeated}.`,
                );
            }

            previousTitles = currentTitles;
        });
    }

    async fillWithAi(userId: string, dto: AiFillRecipesDto) {
        await this.getNutritionistId(userId);

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new BadRequestException('Configura tu API key de OpenAI para usar esta función.');
        }

        const { payload } = dto;
        const allowedFoods = new Set(
            payload.allowedFoodsByDiet.map((food) => this.normalizeFoodName(food)),
        );

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
                    { role: 'system', content: RECIPES_AI_PROMPTS.base },
                    { role: 'user', content: this.buildAiPrompt(payload) },
                ],
            }),
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({} as any));
            const upstreamMessage =
                errorPayload?.error?.message ||
                errorPayload?.message ||
                '';
            const normalizedMessage = String(upstreamMessage).toLowerCase();

            if (
                normalizedMessage.includes('context_length_exceeded') ||
                normalizedMessage.includes('maximum context length') ||
                normalizedMessage.includes('too many tokens') ||
                normalizedMessage.includes('max_tokens')
            ) {
                throw new BadRequestException(
                    'La solicitud supera el límite de tokens/contexto de OpenAI. Reduce bloques, filtros o detalle y vuelve a intentar.',
                );
            }

            throw new BadRequestException(
                upstreamMessage || 'No se pudo completar recetas con IA.',
            );
        }

        const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
            throw new BadRequestException('La IA no devolvió contenido.');
        }

        const parsed = this.parseAiResponse(content);

        if (payload.scope === 'day') {
            const result = parsed as AiFillDayResponse;
            this.validateReplacementGuide(result.meta);

            const slotMap = new Map((payload.slots || []).map((slot) => [slot.slotId, slot]));
            result.recipes.forEach((recipe) => {
                const slot = slotMap.get(recipe.slotId);
                if (!slot) {
                    throw new BadRequestException(`La IA devolvió un slot desconocido: ${recipe.slotId}.`);
                }
                this.validateAiRecipe(
                    recipe,
                    slot.mealSection,
                    allowedFoods,
                    payload.generalSnackFlexAllowed,
                );
            });

            return result;
        }

        const result = parsed as AiFillWeekResponse;
        this.validateReplacementGuide(result.meta);

        const slotMap = new Map(
            (payload.days || []).flatMap((day) =>
                day.slots.map((slot) => [`${day.day}:${slot.slotId}`, slot] as const),
            ),
        );

        result.days.forEach((dayBlock) => {
            dayBlock.recipes.forEach((recipe) => {
                const slot = slotMap.get(`${dayBlock.day}:${recipe.slotId}`);
                if (!slot) {
                    throw new BadRequestException(
                        `La IA devolvió un slot desconocido para ${dayBlock.day}: ${recipe.slotId}.`,
                    );
                }
                this.validateAiRecipe(
                    recipe,
                    slot.mealSection,
                    allowedFoods,
                    payload.generalSnackFlexAllowed,
                );
            });
        });

        this.validateWeekVariety(result, payload.existingAssignments);
        return result;
    }

    async create(userId: string, createDto: CreateRecipeDto) {
        console.log('[RecipesService.create] userId:', userId, 'createDto:', JSON.stringify(createDto, null, 2));
        try {
            const nutritionistId = await this.getNutritionistId(userId);
            console.log('[RecipesService.create] nutritionistId:', nutritionistId);
        const { ingredients, tags, mealSection, customIngredientNames, customIngredients, ...data } = createDto;

        const metadata =
            (tags?.length || mealSection || customIngredientNames?.length || customIngredients?.length)
                ? JSON.parse(JSON.stringify({ tags: tags || [], mealSection: mealSection || null, customIngredientNames: customIngredientNames || [], customIngredients: customIngredients || [] }))
                : undefined;

        const portions = data.portions ?? 1;

        // Calculate Macros if not provided
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

            if (data.calories == null) calcMacros.calories = parseFloat((totalCalories / portions).toFixed(2));
            if (data.proteins == null) calcMacros.proteins = parseFloat((totalProteins / portions).toFixed(2));
            if (data.carbs == null) calcMacros.carbs = parseFloat((totalCarbs / portions).toFixed(2));
            if (data.lipids == null) calcMacros.lipids = parseFloat((totalLipids / portions).toFixed(2));
            if (data.fiber == null) calcMacros.fiber = parseFloat((totalFiber / portions).toFixed(2));
            if (data.sodium == null) calcMacros.sodium = parseFloat((totalSodium / portions).toFixed(2));
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
        } catch (err) {
            console.error('[RecipesService.create] Error:', err);
            throw err;
        }
    }

    async findAll(userId: string) {
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
            return recipes.map((r: any) => ({ ...r, isMine: r.nutritionistId === nutritionistId }));
        } catch (error) {
            // If nutritionist profile not found, return only public recipes
            // or return empty if we want strictness. But likely better to show public ones.
            const recipes = await this.prisma.recipe.findMany({
                where: { isPublic: true },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r: any) => ({ ...r, isMine: false }));
        }
    }

    async findOne(id: string, userId: string) {
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

        if (!recipe) throw new NotFoundException('Recipe not found');

        // Allow if public OR owned
        if (!recipe.isPublic && recipe.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('Access denied');
        }

        return recipe;
    }

    async update(id: string, userId: string, userRole: string, updateDto: CreateRecipeDto) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);

        const isAdmin = userRole && ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(userRole);
        if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('Cannot edit public or others recipes');
        }

        const { ingredients, tags, mealSection, customIngredientNames, customIngredients, ...data } = updateDto;

        const metadata =
            (tags?.length || mealSection || customIngredientNames?.length || customIngredients?.length)
                ? JSON.parse(JSON.stringify({ tags: tags || [], mealSection: mealSection || null, customIngredientNames: customIngredientNames || [], customIngredients: customIngredients || [] }))
                : null;

        const updateData: any = {
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

    async estimateMacros(dto: EstimateMacrosDto): Promise<{ calories: number; proteins: number; carbs: number; lipids: number }> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new BadRequestException('Configura tu API key de OpenAI para usar esta función.');
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
                throw new BadRequestException('Configura tu API key de OpenAI para usar esta función.');
            }

            const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
            const content = json.choices?.[0]?.message?.content;
            if (!content) {
                throw new BadRequestException('No se pudo obtener la respuesta de la IA.');
            }

            const parsed = JSON.parse(content) as { calories?: number; proteins?: number; carbs?: number; lipids?: number };
            return {
                calories: Math.round(parsed.calories ?? 0),
                proteins: Math.round(parsed.proteins ?? 0),
                carbs: Math.round(parsed.carbs ?? 0),
                lipids: Math.round(parsed.lipids ?? 0),
            };
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            throw new BadRequestException('Configura tu API key de OpenAI para usar esta función.');
        }
    }

    async remove(id: string, userId: string, userRole: string) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);

        const isAdmin = userRole && ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(userRole);
        if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('Cannot delete public or others recipes');
        }

        const deleted = await this.prisma.recipe.delete({ where: { id } });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
        return deleted;
    }
}
