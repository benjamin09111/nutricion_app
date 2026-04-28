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
var RecipesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
const recipes_ai_prompts_1 = require("./recipes-ai-prompts");
let RecipesService = RecipesService_1 = class RecipesService {
    prisma;
    cacheService;
    logger = new common_1.Logger(RecipesService_1.name);
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
    normalizeFoodName(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
    normalizeMealSection(value) {
        return this.normalizeFoodName(value || '');
    }
    isStrictMealSection(mealSection) {
        const normalized = this.normalizeMealSection(mealSection);
        return ['desayuno', 'almuerzo', 'cena', 'once'].includes(normalized);
    }
    buildAiPrompt(payload) {
        const scopePrompt = payload.scope === 'week' ? recipes_ai_prompts_1.RECIPES_AI_PROMPTS.week : recipes_ai_prompts_1.RECIPES_AI_PROMPTS.day;
        return [scopePrompt, JSON.stringify(payload)].join('\n');
    }
    getGeminiConfig() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const model = process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
        if (!apiKey) {
            throw new common_1.BadRequestException('Configura GEMINI_API_KEY para usar esta funcion.');
        }
        return { apiKey, model };
    }
    extractGeminiText(payload) {
        const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
        const first = candidates[0];
        const parts = Array.isArray(first?.content?.parts) ? first.content.parts : [];
        const textPart = parts.find((part) => typeof part?.text === 'string');
        return textPart?.text || null;
    }
    mapAiErrorMessage(upstreamMessage) {
        const normalizedMessage = String(upstreamMessage || '').toLowerCase();
        if (normalizedMessage.includes('context_length_exceeded') ||
            normalizedMessage.includes('maximum context length') ||
            normalizedMessage.includes('too many tokens') ||
            normalizedMessage.includes('max_tokens') ||
            normalizedMessage.includes('token')) {
            return 'La solicitud supera el limite de tokens/contexto del modelo. Reduce bloques, filtros o detalle y vuelve a intentar.';
        }
        if (normalizedMessage.includes('resource_exhausted') ||
            normalizedMessage.includes('quota') ||
            normalizedMessage.includes('rate limit') ||
            normalizedMessage.includes('429')) {
            return 'Se alcanzo el limite de uso de la IA (cuota/rate limit). Intenta mas tarde o revisa tu plan.';
        }
        return upstreamMessage || 'No se pudo completar recetas con IA.';
    }
    async callGeminiJson(systemInstruction, userPrompt) {
        const { apiKey, model } = this.getGeminiConfig();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        this.logger.log(`[Gemini] Request model=${model} promptChars=${userPrompt.length}`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: userPrompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                },
            }),
        });
        const raw = await response.json().catch(() => ({}));
        if (!response.ok) {
            const upstreamMessage = raw?.error?.message || raw?.message || '';
            this.logger.error(`[Gemini] Error status=${response.status} message=${upstreamMessage || 'unknown'}`);
            throw new common_1.BadRequestException(this.mapAiErrorMessage(upstreamMessage));
        }
        const text = this.extractGeminiText(raw);
        if (!text) {
            this.logger.error('[Gemini] Empty content in response payload');
            throw new common_1.BadRequestException('La IA no devolvio contenido.');
        }
        this.logger.log(`[Gemini] Response ok chars=${text.length}`);
        this.logger.log(`[Gemini] Raw response:\n${text}`);
        return text;
    }
    extractJsonFromResponse(rawContent) {
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
        throw new common_1.BadRequestException('La IA no devolvió un JSON válido.');
    }
    extractFirstJsonValue(content) {
        const start = content.search(/[\{\[]/);
        if (start === -1)
            return null;
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
            if (char === open)
                depth += 1;
            if (char === close)
                depth -= 1;
            if (depth === 0) {
                return content.slice(start, i + 1);
            }
        }
        return null;
    }
    parseAiResponse(rawContent) {
        const jsonContent = this.extractJsonFromResponse(rawContent);
        try {
            return JSON.parse(jsonContent);
        }
        catch {
            const recovered = this.extractFirstJsonValue(rawContent.trim());
            if (recovered) {
                return JSON.parse(recovered);
            }
            this.logger.error(`[Gemini] JSON parse failed. snippet=${jsonContent.slice(0, 300)}`);
            throw new common_1.BadRequestException('La IA devolvio un formato invalido. Intenta nuevamente.');
        }
    }
    validateAiRecipe(recipe, slotMealSection, allowedFoods, allowFlexibleExternalFoods) {
        if (!recipe.slotId || !recipe.title || !recipe.mealSection || !recipe.recommendedPortion?.trim()) {
            throw new common_1.BadRequestException('La IA devolvió una receta incompleta.');
        }
        const normalizedSlotMealSection = this.normalizeMealSection(slotMealSection);
        const normalizedRecipeMealSection = this.normalizeMealSection(recipe.mealSection);
        if (normalizedSlotMealSection !== normalizedRecipeMealSection) {
            throw new common_1.BadRequestException(`La IA devolvió una sección incompatible para ${recipe.slotId}.`);
        }
        const allIngredients = [...(recipe.ingredients || []), ...(recipe.mainIngredients || [])]
            .map((item) => this.normalizeFoodName(item))
            .filter(Boolean);
        const requiresStrictDietFoods = this.isStrictMealSection(recipe.mealSection);
        if (!requiresStrictDietFoods && allowFlexibleExternalFoods) {
            return [];
        }
        return Array.from(new Set(allIngredients.filter((ingredient) => !allowedFoods.has(ingredient))));
    }
    validateReplacementGuide(meta) {
        if (!meta) {
            throw new common_1.BadRequestException('La IA no devolvió metadata de guía.');
        }
        if (typeof meta.note !== 'string' || !meta.note.trim()) {
            throw new common_1.BadRequestException('La IA no devolvió la nota general requerida.');
        }
        if (!Array.isArray(meta.replacementGuide)) {
            throw new common_1.BadRequestException('La IA no devolvió replacementGuide válido.');
        }
        meta.replacementGuide.forEach((item) => {
            if (!item.mealSection || !Array.isArray(item.suggestions)) {
                throw new common_1.BadRequestException('La IA devolvió replacementGuide incompleto.');
            }
        });
    }
    validateWeekVariety(response, existingAssignments) {
        const orderedDays = response.days || [];
        let previousTitles = null;
        orderedDays.forEach((dayBlock, index) => {
            const currentTitles = new Set(dayBlock.recipes.map((recipe) => this.normalizeFoodName(recipe.title)));
            const fallbackPreviousTitles = index === 0
                ? new Set()
                : new Set(existingAssignments
                    .filter((assignment) => assignment.day === orderedDays[index - 1]?.day)
                    .map((assignment) => this.normalizeFoodName(assignment.title)));
            const titlesToCompare = previousTitles ?? fallbackPreviousTitles;
            const repeated = [...currentTitles].find((title) => titlesToCompare.has(title));
            if (repeated) {
                throw new common_1.BadRequestException(`La IA repitió un plato en días consecutivos: ${repeated}.`);
            }
            previousTitles = currentTitles;
        });
    }
    async fillWithAi(userId, dto) {
        await this.getNutritionistId(userId);
        const { payload } = dto;
        const allowedFoods = new Set(payload.allowedFoodsByDiet.map((food) => this.normalizeFoodName(food)));
        const content = await this.callGeminiJson(recipes_ai_prompts_1.RECIPES_AI_PROMPTS.base, this.buildAiPrompt(payload));
        const parsed = this.parseAiResponse(content);
        if (payload.scope === 'day') {
            const result = parsed;
            this.validateReplacementGuide(result.meta);
            const slotMap = new Map((payload.slots || []).map((slot) => [slot.slotId, slot]));
            result.recipes.forEach((recipe) => {
                const slot = slotMap.get(recipe.slotId);
                if (!slot) {
                    throw new common_1.BadRequestException(`La IA devolvió un slot desconocido: ${recipe.slotId}.`);
                }
                const extraIngredients = this.validateAiRecipe(recipe, slot.mealSection, allowedFoods, payload.generalSnackFlexAllowed);
                if (extraIngredients.length > 0) {
                    recipe.extraIngredients = extraIngredients;
                    this.logger.warn(`[Gemini] Extra ingredients accepted slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`);
                }
            });
            return result;
        }
        const result = parsed;
        this.validateReplacementGuide(result.meta);
        const slotMap = new Map((payload.days || []).flatMap((day) => day.slots.map((slot) => [`${day.day}:${slot.slotId}`, slot])));
        result.days.forEach((dayBlock) => {
            dayBlock.recipes.forEach((recipe) => {
                const slot = slotMap.get(`${dayBlock.day}:${recipe.slotId}`);
                if (!slot) {
                    throw new common_1.BadRequestException(`La IA devolvió un slot desconocido para ${dayBlock.day}: ${recipe.slotId}.`);
                }
                const extraIngredients = this.validateAiRecipe(recipe, slot.mealSection, allowedFoods, payload.generalSnackFlexAllowed);
                if (extraIngredients.length > 0) {
                    recipe.extraIngredients = extraIngredients;
                    this.logger.warn(`[Gemini] Extra ingredients accepted day=${dayBlock.day} slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`);
                }
            });
        });
        this.validateWeekVariety(result, payload.existingAssignments);
        return result;
    }
    sanitizeStringList(value) {
        if (!Array.isArray(value))
            return [];
        return Array.from(new Set(value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)));
    }
    parseQuickAiResponse(rawContent) {
        const jsonContent = this.extractJsonFromResponse(rawContent);
        try {
            return JSON.parse(jsonContent);
        }
        catch {
            const recovered = this.extractFirstJsonValue(rawContent.trim());
            if (recovered) {
                return JSON.parse(recovered);
            }
            throw new common_1.BadRequestException('La IA devolvió un formato inválido para recetas rápidas.');
        }
    }
    normalizeQuickDish(dish) {
        const ingredientsSource = Array.isArray(dish?.ingredients) ? dish.ingredients : [];
        const ingredients = ingredientsSource
            .map((item) => {
            if (typeof item === 'string') {
                const name = item.trim();
                if (!name)
                    return null;
                return { name, quantity: '' };
            }
            if (item && typeof item === 'object') {
                const name = typeof item.name === 'string' ? item.name.trim() : '';
                if (!name)
                    return null;
                const quantity = typeof item.quantity === 'string' ? item.quantity.trim() : '';
                const amount = Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined;
                const unit = typeof item.unit === 'string' ? item.unit.trim() : undefined;
                return { name, quantity, amount, unit };
            }
            return null;
        })
            .filter((item) => !!item);
        const title = typeof dish?.title === 'string' ? dish.title.trim() : '';
        const mealSection = typeof dish?.mealSection === 'string' ? dish.mealSection.trim() : '';
        const recommendedPortion = typeof dish?.recommendedPortion === 'string' ? dish.recommendedPortion.trim() : '';
        const portions = Number.isFinite(Number(dish?.portions))
            ? Math.max(1, Math.round(Number(dish.portions)))
            : 1;
        if (!title || !mealSection || !recommendedPortion) {
            throw new common_1.BadRequestException('La IA devolvió un plato incompleto en recetas rápidas.');
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
    buildQuickAiPrompt(payload) {
        const mealSectionTargets = Array.isArray(payload.mealSectionTargets)
            ? payload.mealSectionTargets
                .filter((target) => target && typeof target.mealSection === 'string')
                .map((target) => ({
                mealSection: String(target.mealSection).trim(),
                count: Number.isFinite(Number(target.count))
                    ? Math.max(1, Math.min(14, Number(target.count)))
                    : 1,
            }))
                .filter((target) => target.mealSection.length > 0)
            : [];
        const desiredByTargets = mealSectionTargets.reduce((sum, target) => sum + target.count, 0);
        const desiredDishCount = Math.max(2, Math.min(60, desiredByTargets > 0 ? desiredByTargets : payload.desiredDishCount || 4));
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
            generationMode: payload.generationMode || 'single',
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
    async quickFillWithAi(userId, dto) {
        await this.getNutritionistId(userId);
        const payload = dto.payload || {};
        const content = await this.callGeminiJson('Eres un nutricionista clínico experto. Responde solo JSON válido.', this.buildQuickAiPrompt(payload));
        const parsed = this.parseQuickAiResponse(content);
        const dishes = Array.isArray(parsed?.dishes) ? parsed.dishes : [];
        if (dishes.length === 0) {
            throw new common_1.BadRequestException('La IA no devolvió platos para recetas rápidas.');
        }
        const normalizedDishes = dishes.map((dish) => this.normalizeQuickDish(dish));
        const note = typeof parsed?.meta?.note === 'string' && parsed.meta.note.trim()
            ? parsed.meta.note.trim()
            : 'Platos generados con IA según contexto proporcionado.';
        return {
            dishes: normalizedDishes,
            meta: {
                note,
            },
        };
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
            const nutritionistId = await this.getNutritionistId(userId).catch(() => null);
            const where = nutritionistId
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
            return recipes.map((r) => {
                const isMine = nutritionistId ? r.nutritionistId === nutritionistId : false;
                const isAdopted = nutritionistId ? !isMine && Array.isArray(r.savedBy) && r.savedBy.length > 0 : false;
                return {
                    ...r,
                    isMine,
                    isAdopted,
                };
            });
        }
        catch (error) {
            console.error('[RecipesService.findAll] Fallback to public recipes:', error);
            const recipes = await this.prisma.recipe.findMany({
                where: { isPublic: true },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return recipes.map((r) => ({ ...r, isMine: false, isAdopted: false }));
        }
    }
    async findOne(id, userId) {
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
        if (!recipe)
            throw new common_1.NotFoundException('Recipe not found');
        const isMine = nutritionistId ? recipe.nutritionistId === nutritionistId : false;
        const isAdopted = nutritionistId ? Array.isArray(recipe.savedBy) && recipe.savedBy.length > 0 : false;
        if (!recipe.isPublic && !isMine && !isAdopted) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return {
            ...recipe,
            isMine,
            isAdopted,
        };
    }
    async addToLibrary(id, userId) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.prisma.recipe.findUnique({
            where: { id },
            select: {
                id: true,
                isPublic: true,
                nutritionistId: true,
            },
        });
        if (!recipe)
            throw new common_1.NotFoundException('Recipe not found');
        if (recipe.nutritionistId === nutritionistId) {
            return {
                recipeId: recipe.id,
                added: false,
                alreadyOwned: true,
            };
        }
        if (!recipe.isPublic) {
            throw new common_1.ForbiddenException('Solo puedes agregar platos públicos de la comunidad.');
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
        const prompt = [
            'Eres un nutricionista. Estima los valores nutricionales por porción para un plato con los siguientes ingredientes.',
            'Responde SOLO un JSON válido con la forma: {"calories": número, "proteins": número, "carbs": número, "lipids": número}',
            'Los valores deben ser por una porción razonable del plato completo.',
            `Ingredientes: ${JSON.stringify(dto.ingredientNames)}`,
        ].join('\n');
        try {
            const content = await this.callGeminiJson('Eres un asistente nutricional. Responde solo JSON.', prompt);
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
            throw new common_1.BadRequestException('No se pudo estimar macros con IA. Verifica GEMINI_API_KEY.');
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
exports.RecipesService = RecipesService = RecipesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map