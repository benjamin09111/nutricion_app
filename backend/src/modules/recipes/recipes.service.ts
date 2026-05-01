import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AiFillPayload, AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { QuickAiFillPayload, QuickAiFillRecipesDto } from './dto/quick-ai-fill-recipes.dto';

import { CacheService } from '../../common/services/cache.service';
import { AiService } from '../../common/services/ai.service';
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
    extraIngredients?: string[];
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

type QuickAiIngredientOutput = {
    name: string;
    quantity?: string;
    amount?: number;
    unit?: string;
};

type QuickAiDishOutput = {
    title: string;
    mealSection: string;
    description: string;
    preparation: string;
    recommendedPortion: string;
    portions: number;
    protein: number;
    calories: number;
    carbs: number;
    fats: number;
    ingredients: QuickAiIngredientOutput[];
};

@Injectable()
export class RecipesService {
    private readonly logger = new Logger(RecipesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
        private readonly aiService: AiService
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

    private mapAiErrorMessage(upstreamMessage: string): string {
        const normalizedMessage = String(upstreamMessage || '').toLowerCase();

        if (
            normalizedMessage.includes('context_length_exceeded') ||
            normalizedMessage.includes('maximum context length') ||
            normalizedMessage.includes('too many tokens') ||
            normalizedMessage.includes('max_tokens') ||
            normalizedMessage.includes('token')
        ) {
            return 'La solicitud supera el límite de tokens/contexto del modelo. Reduce bloques, filtros o detalle y vuelve a intentar.';
        }

        if (
            normalizedMessage.includes('resource_exhausted') ||
            normalizedMessage.includes('quota') ||
            normalizedMessage.includes('rate limit') ||
            normalizedMessage.includes('429')
        ) {
            return 'Se alcanzó el límite de uso de la IA (cuota/rate limit). Intenta más tarde o revisa tu plan.';
        }

        return upstreamMessage || 'No se pudo completar recetas con IA.';
    }

    private async callAiJson(systemInstruction: string, userPrompt: string): Promise<string> {
        try {
            const text = await this.aiService.callJson(systemInstruction, userPrompt);
            this.logger.log(`[AI] Response ok chars=${text.length}`);
            this.logger.log(`[AI] Raw response:\n${text}`);
            return text;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`[AI] Request failed: ${message}`);
            throw new BadRequestException(this.mapAiErrorMessage(message));
        }
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

    private extractFirstJsonValue(content: string): string | null {
        const start = content.search(/[\{\[]/);
        if (start === -1) return null;

        const open = content[start];
        const close = open === '{' ? '}' : ']';
        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let i = start; i < content.length; i += 1) {
            const char = content[i];

            if (inString) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (char === '\\') {
                    escaped = true;
                    continue;
                }
                if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }

            if (char === open) depth += 1;
            if (char === close) depth -= 1;

            if (depth === 0) {
                return content.slice(start, i + 1);
            }
        }

        return null;
    }

    private parseAiResponse(rawContent: string): AiFillDayResponse | AiFillWeekResponse {
        const jsonContent = this.extractJsonFromResponse(rawContent);
        try {
            return JSON.parse(jsonContent) as AiFillDayResponse | AiFillWeekResponse;
        } catch {
            const recovered = this.extractFirstJsonValue(rawContent.trim());
            if (recovered) {
                return JSON.parse(recovered) as AiFillDayResponse | AiFillWeekResponse;
            }
            this.logger.error(`[Gemini] JSON parse failed. snippet=${jsonContent.slice(0, 300)}`);
            throw new BadRequestException('La IA devolvió un formato inválido. Intenta nuevamente.');
        }
    }

    private validateAiRecipe(
        recipe: AiRecipeOutput,
        slotMealSection: string,
        allowedFoods: Set<string>,
        allowFlexibleExternalFoods: boolean,
    ): string[] {
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
        if (!requiresStrictDietFoods && allowFlexibleExternalFoods) {
            return [];
        }

        return Array.from(
            new Set(
                allIngredients.filter((ingredient) => !allowedFoods.has(ingredient)),
            ),
        );
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

        const { payload } = dto;
        const allowedFoods = new Set(
            payload.allowedFoodsByDiet.map((food) => this.normalizeFoodName(food)),
        );

        const content = await this.callAiJson(
            RECIPES_AI_PROMPTS.base,
            this.buildAiPrompt(payload),
        );

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
                const extraIngredients = this.validateAiRecipe(
                    recipe,
                    slot.mealSection,
                    allowedFoods,
                    payload.generalSnackFlexAllowed,
                );
                if (extraIngredients.length > 0) {
                    recipe.extraIngredients = extraIngredients;
                    this.logger.warn(
                        `[Gemini] Extra ingredients accepted slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`,
                    );
                }
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
                const extraIngredients = this.validateAiRecipe(
                    recipe,
                    slot.mealSection,
                    allowedFoods,
                    payload.generalSnackFlexAllowed,
                );
                if (extraIngredients.length > 0) {
                    recipe.extraIngredients = extraIngredients;
                    this.logger.warn(
                        `[Gemini] Extra ingredients accepted day=${dayBlock.day} slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`,
                    );
                }
            });
        });

        this.validateWeekVariety(result, payload.existingAssignments);
        return result;
    }

    private sanitizeStringList(value: unknown): string[] {
        if (!Array.isArray(value)) return [];
        return Array.from(
            new Set(
                value
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter(Boolean),
            ),
        );
    }

    private parseQuickAiResponse(rawContent: string): any {
        const jsonContent = this.extractJsonFromResponse(rawContent);
        try {
            return JSON.parse(jsonContent);
        } catch {
            const recovered = this.extractFirstJsonValue(rawContent.trim());
            if (recovered) {
                return JSON.parse(recovered);
            }
            throw new BadRequestException('La IA devolvió un formato inválido para recetas rápidas.');
        }
    }

    private normalizeQuickDish(dish: any): QuickAiDishOutput {
        const ingredientsSource = Array.isArray(dish?.ingredients) ? dish.ingredients : [];
        const ingredients = ingredientsSource
            .map((item: any) => {
                if (typeof item === 'string') {
                    const name = item.trim();
                    if (!name) return null;
                    return { name, quantity: '' };
                }

                  if (item && typeof item === 'object') {
                      const name = typeof item.name === 'string' ? item.name.trim() : '';
                      if (!name) return null;
                      const quantity = typeof item.quantity === 'string' ? item.quantity.trim() : '';
                      const amount = Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined;
                      const unit = typeof item.unit === 'string' ? item.unit.trim() : undefined;
                      return { name, quantity, amount, unit };
                  }

                return null;
            })
            .filter((item: QuickAiIngredientOutput | null): item is QuickAiIngredientOutput => !!item);

          const title = typeof dish?.title === 'string' ? dish.title.trim() : '';
          const mealSection = typeof dish?.mealSection === 'string' ? dish.mealSection.trim() : '';
          const recommendedPortion =
              typeof dish?.recommendedPortion === 'string' ? dish.recommendedPortion.trim() : '';
          const portions = Number.isFinite(Number(dish?.portions))
              ? Math.max(1, Math.round(Number(dish.portions)))
              : 1;

        if (!title || !mealSection || !recommendedPortion) {
            throw new BadRequestException('La IA devolvió un plato incompleto en recetas rápidas.');
        }

        return {
              title,
              mealSection,
              description: typeof dish?.description === 'string' ? dish.description.trim() : '',
              preparation: typeof dish?.preparation === 'string' ? dish.preparation.trim() : '',
              recommendedPortion,
              portions,
              protein: Number.isFinite(Number(dish?.protein)) ? Number(dish.protein) : 0,
            calories: Number.isFinite(Number(dish?.calories)) ? Number(dish.calories) : 0,
            carbs: Number.isFinite(Number(dish?.carbs)) ? Number(dish.carbs) : 0,
            fats: Number.isFinite(Number(dish?.fats)) ? Number(dish.fats) : 0,
            ingredients,
        };
    }
    private buildQuickAiPrompt(payload: QuickAiFillPayload): string {
        type MealSectionTarget = { mealSection: string; count: number };

        const mealSectionTargets: MealSectionTarget[] = Array.isArray((payload as any).mealSectionTargets)
            ? (payload as any).mealSectionTargets
                .filter((target: any) => target && typeof target.mealSection === 'string')
                .map((target: any) => ({
                    mealSection: String(target.mealSection).trim(),
                    count: Number.isFinite(Number(target.count))
                        ? Math.max(1, Math.min(14, Number(target.count)))
                        : 1,
                }))
                .filter((target: { mealSection: string; count: number }) => target.mealSection.length > 0)
            : [];

        const desiredByTargets = mealSectionTargets.reduce((sum: number, target: MealSectionTarget) => sum + target.count, 0);
        const desiredDishCount = Math.max(
            2,
            Math.min(60, desiredByTargets > 0 ? desiredByTargets : payload.desiredDishCount || 4),
        );

        const safePayload = {
            dietName: payload.dietName || '',
            notes: payload.notes || '',
            allowedFoodsMain: this.sanitizeStringList(payload.allowedFoodsMain),
            restrictedFoods: this.sanitizeStringList(payload.restrictedFoods),
            specialConsiderations: payload.specialConsiderations || '',
            referenceDishes: this.sanitizeStringList(payload.referenceDishes),
            resources: this.sanitizeStringList(payload.resources),
            patient: payload.patient || null,
            existingDishes: Array.isArray(payload.existingDishes) ? payload.existingDishes : [],
            desiredDishCount,
            generationMode: (payload as any).generationMode || 'single',
            mealSectionTargets,
        };

        return [
            'Objetivo: generar platos para el modulo rapido de recetas.',
            'Respeta SIEMPRE las restricciones alimentarias y evita ingredientes prohibidos.',
            'Debes ser creativo para que el paciente no se aburra, sin perder simplicidad ni realismo.',
            'Prioriza alimentos permitidos principales, y considera gustos/restricciones del paciente si vienen informados.',
            'Devuelve la cantidad exacta pedida en desiredDishCount (minimo 2, maximo 60).',
            'Si mealSectionTargets viene informado, respeta exactamente la cantidad solicitada por cada mealSection.',
            'Si generationMode es weekly, prioriza variedad semanal evitando repetir platos muy similares.',
            'Cada plato debe incluir portions como numero entero de porciones que rinde la receta.',
            'Los campos amount y unit de cada ingrediente deben representar la cantidad TOTAL del ingrediente para la receta completa, no por porcion.',
            'Estructura exacta de salida JSON:',
            '{"dishes":[{"title":"string","mealSection":"string","description":"string","preparation":"string","recommendedPortion":"string","portions":1,"protein":0,"calories":0,"carbs":0,"fats":0,"ingredients":[{"name":"string","quantity":"string","amount":0,"unit":"g"}]}],"meta":{"note":"string"}}',
            'Secciones sugeridas para mealSection: Desayuno, Colacion AM, Almuerzo, Colacion PM, Once, Cena, Post entreno.',
            'Si falta informacion, asume criterios nutricionales generales y recetas realistas de cocina chilena/latam.',
            'No incluyas texto fuera del JSON.',
            `CONTEXTO: ${JSON.stringify(safePayload)}`,
        ].join('\n');
    }
    async quickFillWithAi(userId: string, dto: QuickAiFillRecipesDto) {
        await this.getNutritionistId(userId);

        const payload = dto.payload || ({} as QuickAiFillPayload);
        const content = await this.callAiJson(
            'Eres un nutricionista clínico experto. Responde solo JSON válido.',
            this.buildQuickAiPrompt(payload),
        );

        const parsed = this.parseQuickAiResponse(content);
        const dishes = Array.isArray(parsed?.dishes) ? parsed.dishes : [];
        if (dishes.length === 0) {
            throw new BadRequestException('La IA no devolvió platos para recetas rápidas.');
        }

        const normalizedDishes = dishes.map((dish: any) => this.normalizeQuickDish(dish));
        const note =
            typeof parsed?.meta?.note === 'string' && parsed.meta.note.trim()
                ? parsed.meta.note.trim()
                : 'Platos generados con IA según contexto proporcionado.';

        return {
            dishes: normalizedDishes,
            meta: {
                note,
            },
        };
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
            const nutritionistId = await this.getNutritionistId(userId).catch(() => null);
            const where: any = nutritionistId
                ? {
                      OR: [
                          { isPublic: true },
                          { nutritionistId },
                          { savedBy: { some: { nutritionistId } } },
                      ],
                  }
                : { isPublic: true };

            const include = {
                _count: { select: { ingredients: true } },
                nutritionist: { select: { fullName: true } },
                ingredients: {
                    include: {
                        ingredient: {
                            select: { name: true }
                        }
                    }
                },
                ...(nutritionistId
                    ? {
                          savedBy: {
                              where: { nutritionistId },
                              select: { id: true },
                          },
                      }
                    : {}),
            };

            const recipes = await this.prisma.recipe.findMany({
                where,
                include,
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r: any) => {
                const isMine = nutritionistId ? r.nutritionistId === nutritionistId : false;
                const isAdopted = nutritionistId ? !isMine && Array.isArray(r.savedBy) && r.savedBy.length > 0 : false;

                return {
                    ...r,
                    isMine,
                    isAdopted,
                };
            });
        } catch (error) {
            console.error('[RecipesService.findAll] Fallback to public recipes:', error);
            const recipes = await this.prisma.recipe.findMany({
                where: { isPublic: true },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r: any) => ({ ...r, isMine: false, isAdopted: false }));
        }
    }

    async findOne(id: string, userId: string) {
        const nutritionistId = await this.getNutritionistId(userId).catch(() => null);
        const recipe = await this.prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                },
                nutritionist: true,
                ...(nutritionistId
                    ? {
                          savedBy: {
                              where: { nutritionistId },
                              select: { id: true },
                          },
                      }
                    : {}),
            }
        });

        if (!recipe) throw new NotFoundException('Recipe not found');

        const isMine = nutritionistId ? recipe.nutritionistId === nutritionistId : false;
        const isAdopted = nutritionistId ? Array.isArray((recipe as any).savedBy) && (recipe as any).savedBy.length > 0 : false;

        // Allow if public, owned, or saved in the nutritionist library
        if (!recipe.isPublic && !isMine && !isAdopted) {
            throw new ForbiddenException('Access denied');
        }

        return {
            ...recipe,
            isMine,
            isAdopted,
        };
    }

    async addToLibrary(id: string, userId: string) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.prisma.recipe.findUnique({
            where: { id },
            select: {
                id: true,
                isPublic: true,
                nutritionistId: true,
            },
        });

        if (!recipe) throw new NotFoundException('Recipe not found');

        if (recipe.nutritionistId === nutritionistId) {
            return {
                recipeId: recipe.id,
                added: false,
                alreadyOwned: true,
            };
        }

        if (!recipe.isPublic) {
            throw new ForbiddenException('Solo puedes agregar platos públicos de la comunidad.');
        }

        await this.prisma.recipeLibrary.upsert({
            where: {
                nutritionistId_recipeId: {
                    nutritionistId,
                    recipeId: recipe.id,
                },
            },
            update: {},
            create: {
                nutritionistId,
                recipeId: recipe.id,
            },
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
        await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');

        return {
            recipeId: recipe.id,
            added: true,
        };
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
        const prompt = [
            'Eres un nutricionista. Estima los valores nutricionales por porción para un plato con los siguientes ingredientes.',
            'Responde SOLO un JSON válido con la forma: {"calories": número, "proteins": número, "carbs": número, "lipids": número}',
            'Los valores deben ser por una porción razonable del plato completo.',
            `Ingredientes: ${JSON.stringify(dto.ingredientNames)}`,
        ].join('\n');

        try {
            const content = await this.callAiJson(
                'Eres un asistente nutricional. Responde solo JSON.',
                prompt,
            );

            const parsed = JSON.parse(content) as { calories?: number; proteins?: number; carbs?: number; lipids?: number };
            return {
                calories: Math.round(parsed.calories ?? 0),
                proteins: Math.round(parsed.proteins ?? 0),
                carbs: Math.round(parsed.carbs ?? 0),
                lipids: Math.round(parsed.lipids ?? 0),
            };
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            throw new BadRequestException('No se pudo estimar macros con IA. Verifica DEEPSEEK_API_KEY.');
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


