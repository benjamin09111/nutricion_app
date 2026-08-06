import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AiFillPayload, AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import {
  QuickAiFillPayload,
  QuickAiFillRecipesDto,
} from './dto/quick-ai-fill-recipes.dto';

import { CacheService } from '../../common/services/cache.service';
import { AiService } from '../../common/services/ai.service';
import { RECIPES_AI_PROMPTS } from './recipes-ai-prompts';
import {
  aiFillDayResponseSchema,
  aiFillWeekResponseSchema,
  quickAiFillResponseSchema,
} from './recipes-ai-schemas';
import { isAdminRole } from '../permissions/permissions.constants';
import { PlanUsageService } from '../permissions/plan-usage.service';
import type { ZodTypeAny } from 'zod';
import { z } from 'zod';
import { buildPatientAiContext } from '../patients/patient-ai-context.builder';
import {
  buildPlanAiRequest,
  stringifyPlanAiRequest,
} from '../../common/services/plan-ai-contract';

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
  ingredients: Array<{
    name: string;
    quantity?: string;
    amount?: number;
    unit?: string;
  }>;
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
  optional?: boolean;
};

type QuickAiDishOutput = {
  slotId?: string;
  optionIndex?: number;
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
    private readonly aiService: AiService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  private async getNutritionistId(accountId: string): Promise<string> {
    // Assuming accountId IS the userId passed from controller (which is true now)
    // But wait, the controller passes req.user.id which IS the User ID.
    // We need the Nutritionist ID.
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { accountId },
      select: { id: true },
    });
    if (!nutritionist)
      throw new NotFoundException('Nutritionist profile not found');
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

  private ingredientAmountInGrams(amount: number, unit: string): number | null {
    const normalized = String(unit || '').trim().toLowerCase();
    if (['g', 'gr', 'gramo', 'gramos'].includes(normalized)) return amount;
    if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(normalized)) {
      return amount * 1000;
    }
    return null;
  }

  private async calculateIngredientMacros(
    ingredients: Array<{ ingredientId: string; amount: number; unit: string }>,
    portions: number,
  ) {
    const ingredientIds = ingredients.map((ingredient) => ingredient.ingredientId);
    const dbIngredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    const totals = {
      calories: 0,
      proteins: 0,
      carbs: 0,
      lipids: 0,
      fiber: 0,
      sodium: 0,
    };

    for (const ingredient of ingredients) {
      const grams = this.ingredientAmountInGrams(ingredient.amount, ingredient.unit);
      if (grams === null) {
        throw new BadRequestException(
          `No se pueden calcular macros automáticamente para la unidad "${ingredient.unit}". Usa gramos/kg o ingresa macros manuales por porción.`,
        );
      }

      const dbIngredient = dbIngredients.find((item) => item.id === ingredient.ingredientId);
      if (!dbIngredient) continue;
      const factor = grams / 100;
      totals.calories += dbIngredient.calories * factor;
      totals.proteins += dbIngredient.proteins * factor;
      totals.carbs += dbIngredient.carbs * factor;
      totals.lipids += dbIngredient.lipids * factor;
      totals.fiber += (dbIngredient.fiber ?? 0) * factor;
      totals.sodium += (dbIngredient.sodium ?? 0) * factor;
    }

    return Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, Number((value / portions).toFixed(2))]),
    ) as typeof totals;
  }

  private isStrictMealSection(mealSection?: string): boolean {
    const normalized = this.normalizeMealSection(mealSection);
    return ['desayuno', 'almuerzo', 'cena', 'once'].includes(normalized);
  }

  private buildAiPrompt(payload: AiFillPayload): string {
    const request = buildPlanAiRequest({
      patient: payload.patientContext || payload.patientProfile,
      availableFoods: [
        ...(payload.allowedFoodsByDiet || []),
        ...(payload.preferredFoods || []),
      ],
      objective:
        payload.nutritionistNotes ||
        'Completar los espacios vacíos del plan alimentario.',
      instruction: [
        `Genera un plan ${payload.scope === 'week' ? 'semanal' : 'diario'}.`,
        'Completa solo los espacios vacíos y conserva los existentes.',
        `Respeta estas restricciones: ${(payload.dietRestrictions || []).join(', ') || 'ninguna registrada'}.`,
        `Slots: ${JSON.stringify(payload.slots || payload.days || [])}.`,
        `Asignaciones existentes: ${JSON.stringify(payload.existingAssignments || [])}.`,
      ].join(' '),
      allowExternalFoods: payload.allowExternalFoods === true,
      rules: [
        'Ajusta calorías y macronutrientes a targets.',
        'Usa porciones clínicas realistas y preparación breve.',
      ],
      tools: {
        scope: payload.scope,
        targets: payload.targets,
        patientGoals: payload.patientGoals,
        rules: payload.rules,
        recipeStyle: payload.recipeStyle,
        timeStyle: payload.timeStyle,
      },
      outputSchema:
        payload.scope === 'week'
          ? {
              days: [
                {
                  day: 'string',
                  recipes: [
                    {
                      slotId: 'string',
                      mealSection: 'string',
                      title: 'string',
                      description: 'string',
                      preparation: 'string',
                      recommendedPortion: 'string',
                      complexity: 'simple',
                      protein: 0,
                      calories: 0,
                      carbs: 0,
                      fats: 0,
                      ingredients: [
                        {
                          name: 'string',
                          quantity: 'string',
                          amount: 0,
                          unit: 'g',
                          optional: false,
                        },
                      ],
                      mainIngredients: ['string'],
                      extraIngredients: ['string'],
                    },
                  ],
                },
              ],
              meta: { note: 'string', replacementGuide: [] },
            }
          : {
              recipes: [
                {
                  slotId: 'string',
                  mealSection: 'string',
                  title: 'string',
                  description: 'string',
                  preparation: 'string',
                  recommendedPortion: 'string',
                  complexity: 'simple',
                  protein: 0,
                  calories: 0,
                  carbs: 0,
                  fats: 0,
                  ingredients: [
                    {
                      name: 'string',
                      quantity: 'string',
                      amount: 0,
                      unit: 'g',
                      optional: false,
                    },
                  ],
                  mainIngredients: ['string'],
                  extraIngredients: ['string'],
                },
              ],
              meta: { note: 'string', replacementGuide: [] },
            },
    });

    return stringifyPlanAiRequest(request);
  }

  private async resolvePatientContext(
    nutritionistId: string,
    payload: {
      patientId?: string;
      patientContext?: Record<string, unknown> | null;
      patient?: {
        ageYears?: number | null;
        birthDate?: string | Date | null;
        gender?: string | null;
        height?: number | null;
        weight?: number | null;
        activityLevel?: string | null;
        nutritionalFocus?: string | null;
        fitnessGoals?: string | null;
        clinicalSummary?: string | null;
        restrictions?: string[] | null;
        likes?: string | null;
        dislikedFoods?: string[] | null;
      };
    },
  ) {
    if (payload.patientContext) return payload.patientContext;

    if (payload.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: payload.patientId, nutritionistId },
        select: {
          age: true,
          birthDate: true,
          gender: true,
          height: true,
          weight: true,
          activityLevel: true,
          nutritionalFocus: true,
          fitnessGoals: true,
          primaryCondition: true,
          clinicalSummary: true,
          dietRestrictions: true,
          likes: true,
          dislikedFoods: true,
          customVariables: true,
          clinicalRecord: true,
          consultations: {
            orderBy: { date: 'desc' },
            take: 3,
            select: {
              date: true,
              title: true,
              description: true,
              plansDelivered: true,
            },
          },
        },
      });

      if (patient) {
        return buildPatientAiContext(patient);
      }
    }

    if (payload.patient) {
      return buildPatientAiContext({
        age: payload.patient.ageYears ?? null,
        birthDate: payload.patient.birthDate ?? null,
        gender: payload.patient.gender ?? null,
        height: payload.patient.height ?? null,
        weight: payload.patient.weight ?? null,
        activityLevel: payload.patient.activityLevel ?? null,
        nutritionalFocus: payload.patient.nutritionalFocus ?? null,
        fitnessGoals: payload.patient.fitnessGoals ?? null,
        clinicalSummary: payload.patient.clinicalSummary ?? null,
        dietRestrictions: payload.patient.restrictions ?? [],
        likes: payload.patient.likes ?? null,
        dislikedFoods: payload.patient.dislikedFoods ?? [],
      });
    }

    return null;
  }

  private mapAiErrorMessage(upstreamMessage: string): string {
    const normalizedMessage = String(upstreamMessage || '').toLowerCase();

    if (
      normalizedMessage.includes('high demand') ||
      normalizedMessage.includes('overloaded') ||
      normalizedMessage.includes('temporarily unavailable') ||
      normalizedMessage.includes('service unavailable') ||
      normalizedMessage.includes('503')
    ) {
      return 'Naty está con alta demanda temporal. Intentó usar los proveedores alternativos disponibles; espera unos minutos e inténtalo nuevamente.';
    }

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

  private async callAiObject(
    accountId: string,
    taskName: string,
    systemInstruction: string,
    userPrompt: string,
    schema: ZodTypeAny,
  ): Promise<{
    provider: 'gemini' | 'deepseek' | 'openai';
    modelId: string;
    object: any;
  }> {
    let quotaReserved = false;
    try {
      await this.planUsageService.consumeQuota(accountId, 'ai.calls.limit');
      quotaReserved = true;
      const result = await this.aiService.generateStructuredObject(
        taskName,
        systemInstruction,
        userPrompt,
        schema,
      );
      this.logger.log(
        `[AI] Response ok provider=${result.provider} model=${result.modelId}`,
      );
      return result as {
        provider: 'gemini' | 'deepseek' | 'openai';
        modelId: string;
        object: any;
      };
    } catch (error) {
      if (quotaReserved) {
        await this.planUsageService.refundQuota(accountId, 'ai.calls.limit');
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
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
    const start = content.search(/[{[]/);
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

  private parseAiResponse(
    rawContent: string,
  ): AiFillDayResponse | AiFillWeekResponse {
    const jsonContent = this.extractJsonFromResponse(rawContent);
    try {
      return JSON.parse(jsonContent) as AiFillDayResponse | AiFillWeekResponse;
    } catch {
      const recovered = this.extractFirstJsonValue(rawContent.trim());
      if (recovered) {
        return JSON.parse(recovered) as AiFillDayResponse | AiFillWeekResponse;
      }
      this.logger.error(
        `[Gemini] JSON parse failed. snippet=${jsonContent.slice(0, 300)}`,
      );
      throw new BadRequestException(
        'La IA devolvió un formato inválido. Intenta nuevamente.',
      );
    }
  }

  private validateAiRecipe(
    recipe: AiRecipeOutput,
    slotMealSection: string,
    allowedFoods: Set<string>,
    allowFlexibleExternalFoods: boolean,
  ): string[] {
    if (
      !recipe.slotId ||
      !recipe.title ||
      !recipe.mealSection ||
      !recipe.recommendedPortion?.trim()
    ) {
      throw new BadRequestException('La IA devolvió una receta incompleta.');
    }

    const normalizedSlotMealSection =
      this.normalizeMealSection(slotMealSection);
    const normalizedRecipeMealSection = this.normalizeMealSection(
      recipe.mealSection,
    );
    if (normalizedSlotMealSection !== normalizedRecipeMealSection) {
      throw new BadRequestException(
        `La IA devolvió una sección incompatible para ${recipe.slotId}.`,
      );
    }

    const allIngredients = [
      ...(recipe.ingredients || []),
      ...(recipe.mainIngredients || []),
    ]
      .map((item) =>
        this.normalizeFoodName(
          typeof item === 'string' ? item : item?.name || '',
        ),
      )
      .filter(Boolean);

    const requiresStrictDietFoods = this.isStrictMealSection(
      recipe.mealSection,
    );
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
      throw new BadRequestException(
        'La IA no devolvió la nota general requerida.',
      );
    }

    if (!Array.isArray(meta.replacementGuide)) {
      throw new BadRequestException(
        'La IA no devolvió replacementGuide válido.',
      );
    }

    meta.replacementGuide.forEach((item) => {
      if (!item.mealSection || !Array.isArray(item.suggestions)) {
        throw new BadRequestException(
          'La IA devolvió replacementGuide incompleto.',
        );
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
                .filter(
                  (assignment) =>
                    assignment.day === orderedDays[index - 1]?.day,
                )
                .map((assignment) => this.normalizeFoodName(assignment.title)),
            );

      const titlesToCompare = previousTitles ?? fallbackPreviousTitles;
      const repeated = [...currentTitles].find((title) =>
        titlesToCompare.has(title),
      );
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
    const patientContext = await this.resolvePatientContext(userId, payload);
    const payloadWithContext = {
      ...payload,
      patientContext,
    } as AiFillPayload;
    const allowedFoods = new Set(
      payload.allowedFoodsByDiet.map((food) => this.normalizeFoodName(food)),
    );

    const structured = await this.callAiObject(
      userId,
      'recipes.fill',
      RECIPES_AI_PROMPTS.base,
      this.buildAiPrompt(payloadWithContext),
      payload.scope === 'day'
        ? aiFillDayResponseSchema
        : aiFillWeekResponseSchema,
    );

    if (payload.scope === 'day') {
      const result = structured.object as AiFillDayResponse;
      this.validateReplacementGuide(result.meta);

      const slotMap = new Map(
        (payload.slots || []).map((slot) => [slot.slotId, slot]),
      );
      result.recipes.forEach((recipe) => {
        const slot = slotMap.get(recipe.slotId);
        if (!slot) {
          throw new BadRequestException(
            `La IA devolvió un slot desconocido: ${recipe.slotId}.`,
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
            `[AI:${structured.provider}] Extra ingredients accepted slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`,
          );
        }
      });

      return result;
    }

    const result = structured.object as AiFillWeekResponse;
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
            `[AI:${structured.provider}] Extra ingredients accepted day=${dayBlock.day} slot=${recipe.slotId} extras=${JSON.stringify(extraIngredients)}`,
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

  private sanitizeQuickExistingDishes(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const title =
          typeof item.title === 'string' ? item.title.trim().slice(0, 120) : '';
        const mealSection =
          typeof item.mealSection === 'string'
            ? item.mealSection.trim().slice(0, 40)
            : '';

        if (!title || !mealSection) return null;
        return { title, mealSection };
      })
      .filter(Boolean)
      .slice(0, 24);
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
      throw new BadRequestException(
        'La IA devolvió un formato inválido para recetas rápidas.',
      );
    }
  }

  private normalizeQuickDish(dish: any): QuickAiDishOutput {
    const ingredientsSource = Array.isArray(dish?.ingredients)
      ? dish.ingredients
      : [];
    const ingredients = ingredientsSource
      .map((item: any) => {
        if (typeof item === 'string') {
          const name = item.trim();
          if (!name) return null;
          return { name, quantity: '', optional: false };
        }

        if (item && typeof item === 'object') {
          const name = typeof item.name === 'string' ? item.name.trim() : '';
          if (!name) return null;
          const quantity =
            typeof item.quantity === 'string' ? item.quantity.trim() : '';
          const amount = Number.isFinite(Number(item.amount))
            ? Number(item.amount)
            : undefined;
          const unit =
            typeof item.unit === 'string' ? item.unit.trim() : undefined;
          return {
            name,
            quantity,
            amount,
            unit,
            optional: item.optional === true,
          };
        }

        return null;
      })
      .filter(
        (
          item: QuickAiIngredientOutput | null,
        ): item is QuickAiIngredientOutput => !!item,
      );

    const title = typeof dish?.title === 'string' ? dish.title.trim() : '';
    const slotId = typeof dish?.slotId === 'string' ? dish.slotId.trim() : '';
    const optionIndex = Number.isInteger(dish?.optionIndex) ? Number(dish.optionIndex) : undefined;
    const mealSection =
      typeof dish?.mealSection === 'string' ? dish.mealSection.trim() : '';
    const recommendedPortion =
      typeof dish?.recommendedPortion === 'string' &&
      dish.recommendedPortion.trim()
        ? dish.recommendedPortion.trim()
        : '1 porcion individual';
    const portions = Number.isFinite(Number(dish?.portions))
      ? Math.max(1, Math.round(Number(dish.portions)))
      : 1;

    if (!title || !mealSection) {
      throw new BadRequestException(
        'La IA devolvió un plato incompleto en recetas rápidas.',
      );
    }

    return {
      ...(slotId ? { slotId } : {}),
      ...(optionIndex !== undefined ? { optionIndex } : {}),
      title,
      mealSection,
      description:
        typeof dish?.description === 'string' ? dish.description.trim() : '',
      preparation:
        typeof dish?.preparation === 'string' ? dish.preparation.trim() : '',
      recommendedPortion,
      portions,
      protein: Number.isFinite(Number(dish?.protein))
        ? Number(dish.protein)
        : 0,
      calories: Number.isFinite(Number(dish?.calories))
        ? Number(dish.calories)
        : 0,
      carbs: Number.isFinite(Number(dish?.carbs)) ? Number(dish.carbs) : 0,
      fats: Number.isFinite(Number(dish?.fats)) ? Number(dish.fats) : 0,
      ingredients,
    };
  }
  private buildQuickAiPrompt(payload: QuickAiFillPayload): string {
    type MealSectionTarget = { mealSection: string; count: number; slotId?: string; optionIndexes?: number[] };

    const mealSectionTargets: MealSectionTarget[] = Array.isArray(
      (payload as any).mealSectionTargets,
    )
      ? (payload as any).mealSectionTargets
          .filter(
            (target: any) => target && typeof target.mealSection === 'string',
          )
          .map((target: any) => ({
            mealSection: String(target.mealSection).trim(),
              count: Number.isFinite(Number(target.count))
                ? Math.max(1, Math.min(14, Number(target.count)))
                : 1,
              slotId: typeof target.slotId === 'string' ? target.slotId.trim() : undefined,
              optionIndexes: Array.isArray(target.optionIndexes)
                ? target.optionIndexes.filter((index: unknown) => Number.isInteger(index) && Number(index) >= 0 && Number(index) <= 2)
                : undefined,
          }))
          .filter(
            (target: { mealSection: string; count: number }) =>
              target.mealSection.length > 0,
          )
      : [];

    const desiredByTargets = mealSectionTargets.reduce(
      (sum: number, target: MealSectionTarget) => sum + target.count,
      0,
    );
    const desiredDishCount = Math.max(
      1,
      Math.min(
        60,
        desiredByTargets > 0 ? desiredByTargets : payload.desiredDishCount || 4,
      ),
    );

    const safePayload = {
      dietName: payload.dietName || '',
      notes: payload.notes || '',
      allowedFoodsMain: this.sanitizeStringList(payload.allowedFoodsMain).slice(
        0,
        40,
      ),
      restrictedFoods: this.sanitizeStringList(payload.restrictedFoods).slice(
        0,
        20,
      ),
      exchangeGuide: this.sanitizeStringList(payload.exchangeGuide).slice(
        0,
        18,
      ),
      specialConsiderations: payload.specialConsiderations || '',
      referenceDishes: this.sanitizeStringList(payload.referenceDishes).slice(
        0,
        12,
      ),
      resources: this.sanitizeStringList(payload.resources).slice(0, 12),
      patientContext: payload.patientContext || null,
      patient: payload.patientContext || payload.patient || null,
      nutritionalTargets: payload.nutritionalTargets || null,
      existingDishes: this.sanitizeQuickExistingDishes(payload.existingDishes),
      allowExternalFoods: Boolean((payload as any).allowExternalFoods),
      desiredDishCount,
      generationMode: (payload as any).generationMode || 'single',
      mealSectionTargets,
    };

    const request = buildPlanAiRequest({
      patient: safePayload.patient,
      availableFoods: safePayload.allowedFoodsMain,
      objective:
        safePayload.notes ||
        'Crear recetas prácticas alineadas con el objetivo nutricional.',
      instruction: [
        'Genera platos realistas de cocina chilena/latinoamericana.',
        `Devuelve exactamente ${safePayload.desiredDishCount} platos y respeta mealSectionTargets.`,
        'Ajusta porciones y macros según nutritionalTargets cuando exista.',
        'Estas comidas se repetirán como una guía general durante la semana, no como recetas exactas para un día específico.',
        safePayload.generationMode === 'options'
          ? 'Para cada target de opciones, devuelve una sugerencia independiente por optionIndex solicitado. Conserva exactamente el slotId y optionIndex del target; no combines alternativas usando "/".'
          : 'Entrega nombres amplios y prácticos con alternativas usando "/" entre opciones equivalentes, por ejemplo: "Salmón/Pollo cocido con Ensalada/Arroz".',
        'Incluye sustitutos razonables para la proteína, el acompañamiento y los vegetales cuando corresponda; evita nombres demasiado específicos o preparaciones únicas.',
        'Interpreta availableFoods como una guía de alimentos y categorías que el nutricionista desea utilizar, no como coincidencias literales. Por ejemplo, interpreta "ensaladas verdes" como ingredientes concretos apropiados, como lechuga, apio u otras hojas verdes.',
        'Prioriza y representa esas categorías en los platos con ingredientes concretos adecuados; si una indicación es amplia, decide tú la composición más razonable.',
        safePayload.allowExternalFoods
          ? 'Si los alimentos principales son insuficientes, puedes complementar con ingredientes simples y generales disponibles para una familia promedio en Chile o en supermercados comunes.'
          : 'No reemplaces, ignores ni complementes los alimentos principales entregados con alimentos fuera de esa lista.',
        `No repitas platos existentes: ${JSON.stringify(safePayload.existingDishes)}.`,
        safePayload.specialConsiderations,
      ]
        .filter(Boolean)
        .join(' '),
       allowExternalFoods: safePayload.allowExternalFoods,
      rules: [
        'Usa 3 a 6 ingredientes principales por plato.',
        'ingredients debe incluir name, quantity, amount, unit y optional.',
        'Los ingredientes externos deben ir en extraIngredients; si están prohibidos, no los uses.',
      ],
      tools: {
        mealSectionTargets: safePayload.mealSectionTargets,
        nutritionalTargets: safePayload.nutritionalTargets,
        generationMode: safePayload.generationMode,
      },
      outputSchema: {
        dishes: [
          {
            slotId: 'string opcional; obligatorio cuando generationMode sea options',
            optionIndex: 0,
            title: 'string',
            mealSection: 'string',
            description: 'string',
            preparation: 'string',
            recommendedPortion: 'string',
            portions: 1,
            protein: 0,
            calories: 0,
            carbs: 0,
            fats: 0,
            ingredients: [
              {
                name: 'string',
                quantity: 'string',
                amount: 0,
                unit: 'g',
                optional: false,
              },
            ],
          },
        ],
        meta: { note: 'string' },
      },
    });

    return stringifyPlanAiRequest(request);
  }

  async quickFillWithAi(userId: string, dto: QuickAiFillRecipesDto) {
    await this.getNutritionistId(userId);

    const payload = dto.payload || ({} as QuickAiFillPayload);
    const patientContext = await this.resolvePatientContext(userId, payload);
    const payloadWithContext = {
      ...payload,
      patientContext,
    } as QuickAiFillPayload & {
      patientContext: Record<string, unknown> | null;
    };
    const structured = await this.callAiObject(
      userId,
      'recipes.quick-fill',
      'Eres un nutricionista clínico experto. Responde solo JSON válido.',
      this.buildQuickAiPrompt(payloadWithContext),
      quickAiFillResponseSchema,
    );

    const parsed = structured.object;
    const dishes = Array.isArray(parsed?.dishes) ? parsed.dishes : [];
    if (dishes.length === 0) {
      throw new BadRequestException(
        'La IA no devolvió platos para recetas rápidas.',
      );
    }

    const normalizedDishes = dishes.map((dish: any) =>
      this.normalizeQuickDish(dish),
    );
    if (payload.generationMode === 'options') {
      const targets = new Map(
        (payload.mealSectionTargets || [])
          .filter((target) => target.slotId)
          .map((target) => [target.slotId as string, new Set(target.optionIndexes || [])]),
      );
      normalizedDishes.forEach((dish: QuickAiDishOutput) => {
        if (!dish.slotId || dish.optionIndex === undefined || !targets.get(dish.slotId)?.has(dish.optionIndex)) {
          throw new BadRequestException('La IA devolvió una opción fuera de la celda solicitada. Intenta nuevamente.');
        }
      });
    }
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
    console.log(
      '[RecipesService.create] userId:',
      userId,
      'createDto:',
      JSON.stringify(createDto, null, 2),
    );
    try {
      const nutritionistId = await this.getNutritionistId(userId);
      console.log('[RecipesService.create] nutritionistId:', nutritionistId);
      const {
        ingredients,
        tags,
        mealSection,
        customIngredientNames,
        customIngredients,
        ...data
      } = createDto;

      const metadata =
        tags?.length ||
        mealSection ||
        customIngredientNames?.length ||
        customIngredients?.length
          ? JSON.parse(
              JSON.stringify({
                tags: tags || [],
                mealSection: mealSection || null,
                customIngredientNames: customIngredientNames || [],
                customIngredients: customIngredients || [],
              }),
            )
          : undefined;

      const portions = data.portions ?? 1;

      const calcMacros = {
        calories: data.calories ?? 0,
        proteins: data.proteins ?? 0,
        carbs: data.carbs ?? 0,
        lipids: data.lipids ?? 0,
        fiber: 0,
        sodium: 0,
      };

      if (
        ingredients &&
        ingredients.length > 0 &&
        (data.calories == null ||
          data.proteins == null ||
          data.fiber == null ||
          data.sodium == null)
      ) {
        const ingredientMacros = await this.calculateIngredientMacros(ingredients, portions);

        if (data.calories == null)
          calcMacros.calories = ingredientMacros.calories;
        if (data.proteins == null)
          calcMacros.proteins = ingredientMacros.proteins;
        if (data.carbs == null)
          calcMacros.carbs = ingredientMacros.carbs;
        if (data.lipids == null)
          calcMacros.lipids = ingredientMacros.lipids;
        if (data.fiber == null)
          calcMacros.fiber = ingredientMacros.fiber;
        if (data.sodium == null)
          calcMacros.sodium = ingredientMacros.sodium;
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
                create: ingredients.map((ing) => ({
                  ingredientId: ing.ingredientId,
                  amount: ing.amount,
                  unit: ing.unit,
                  brandSuggestion: ing.brandSuggestion,
                  isMain: ing.isMain ?? true,
                })),
              }
            : undefined,
        },
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      });

      await this.cacheService.invalidateNutritionistPrefix(
        nutritionistId,
        'recipes',
      );
      await this.cacheService.invalidateNutritionistPrefix(
        nutritionistId,
        'dashboard',
      );
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
      const nutritionistId = await this.getNutritionistId(userId).catch(
        () => null,
      );
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
              select: { name: true },
            },
          },
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
        orderBy: { updatedAt: 'desc' },
      });
      return recipes.map((r: any) => {
        const isMine = nutritionistId
          ? r.nutritionistId === nutritionistId
          : false;
        const isAdopted = nutritionistId
          ? !isMine && Array.isArray(r.savedBy) && r.savedBy.length > 0
          : false;

        return {
          ...r,
          isMine,
          isAdopted,
        };
      });
    } catch (error) {
      console.error(
        '[RecipesService.findAll] Fallback to public recipes:',
        error,
      );
      const recipes = await this.prisma.recipe.findMany({
        where: { isPublic: true },
        include: {
          _count: { select: { ingredients: true } },
          nutritionist: { select: { fullName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return recipes.map((r: any) => ({
        ...r,
        isMine: false,
        isAdopted: false,
      }));
    }
  }

  async findOne(id: string, userId: string) {
    const nutritionistId = await this.getNutritionistId(userId).catch(
      () => null,
    );
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
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
      },
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    const isMine = nutritionistId
      ? recipe.nutritionistId === nutritionistId
      : false;
    const isAdopted = nutritionistId
      ? Array.isArray((recipe as any).savedBy) &&
        (recipe as any).savedBy.length > 0
      : false;

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
      throw new ForbiddenException(
        'Solo puedes agregar platos públicos de la comunidad.',
      );
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

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'recipes',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
    await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');

    return {
      recipeId: recipe.id,
      added: true,
    };
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    updateDto: CreateRecipeDto,
  ) {
    const nutritionistId = await this.getNutritionistId(userId);
    const recipe = await this.findOne(id, userId);

    const isAdmin = isAdminRole(userRole);
    if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
      throw new ForbiddenException('Cannot edit public or others recipes');
    }

    const {
      ingredients,
      tags,
      mealSection,
      customIngredientNames,
      customIngredients,
      ...data
    } = updateDto;

    const metadata =
      tags?.length ||
      mealSection ||
      customIngredientNames?.length ||
      customIngredients?.length
        ? JSON.parse(
            JSON.stringify({
              tags: tags || [],
              mealSection: mealSection || null,
              customIngredientNames: customIngredientNames || [],
              customIngredients: customIngredients || [],
            }),
          )
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
      metadata: metadata ?? undefined,
    };

    if (ingredients) {
      const canCalculateIngredientMacros = ingredients.every(
        (ingredient) => this.ingredientAmountInGrams(ingredient.amount, ingredient.unit) !== null,
      );
      const hasManualMacros = [data.calories, data.proteins, data.carbs, data.lipids]
        .every((value) => value != null);
      const ingredientMacros = canCalculateIngredientMacros
        ? await this.calculateIngredientMacros(ingredients, data.portions ?? 1)
        : null;
      updateData.ingredients = {
        deleteMany: {},
        create: ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          unit: ing.unit,
          brandSuggestion: ing.brandSuggestion,
          isMain: ing.isMain ?? true,
        })),
      };
      if (ingredientMacros) {
        updateData.calories = ingredientMacros.calories;
        updateData.proteins = ingredientMacros.proteins;
        updateData.carbs = ingredientMacros.carbs;
        updateData.lipids = ingredientMacros.lipids;
        updateData.fiber = ingredientMacros.fiber;
        updateData.sodium = ingredientMacros.sodium;
      } else if (!hasManualMacros) {
        throw new BadRequestException(
          'Las recetas con unidades domésticas necesitan macros manuales por porción.',
        );
      }
    }

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: updateData,
      include: { ingredients: true },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'recipes',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
    await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
    return updated;
  }

  async estimateMacros(
    userId: string,
    dto: EstimateMacrosDto,
  ): Promise<{
    calories: number;
    proteins: number;
    carbs: number;
    lipids: number;
  }> {
    const prompt = [
      'Eres un nutricionista. Estima los valores nutricionales por porción para un plato con los siguientes ingredientes.',
      'Responde SOLO un JSON válido con la forma: {"calories": número, "proteins": número, "carbs": número, "lipids": número}',
      'Los valores deben ser por una porción razonable del plato completo.',
      `Ingredientes: ${JSON.stringify(dto.ingredientNames)}`,
    ].join('\n');

    let quotaReserved = false;
    try {
      await this.planUsageService.consumeQuota(userId, 'ai.calls.limit');
      quotaReserved = true;
      const structured = await this.aiService.generateStructuredObject(
        'recipes.estimate-macros',
        'Eres un asistente nutricional. Responde solo JSON.',
        prompt,
        z
          .object({
            calories: z.number().finite(),
            proteins: z.number().finite(),
            carbs: z.number().finite(),
            lipids: z.number().finite(),
          })
          .strict(),
      );

      const parsed = structured.object as {
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
      };
      return {
        calories: Math.round(parsed.calories ?? 0),
        proteins: Math.round(parsed.proteins ?? 0),
        carbs: Math.round(parsed.carbs ?? 0),
        lipids: Math.round(parsed.lipids ?? 0),
      };
    } catch (err) {
      if (quotaReserved) {
        await this.planUsageService.refundQuota(userId, 'ai.calls.limit');
      }
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        'No se pudo estimar macros con IA. Verifica GEMINI_API_KEY o las credenciales del proveedor configurado.',
      );
    }
  }

  async remove(id: string, userId: string, userRole: string) {
    const nutritionistId = await this.getNutritionistId(userId);
    const recipe = await this.findOne(id, userId);

    const isAdmin = isAdminRole(userRole);
    if (!isAdmin && recipe.nutritionistId !== nutritionistId) {
      throw new ForbiddenException('Cannot delete public or others recipes');
    }

    const deleted = await this.prisma.recipe.delete({ where: { id } });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'recipes',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    await this.cacheService.invalidateNutritionistPrefix(userId, 'recipes');
    await this.cacheService.invalidateNutritionistPrefix(userId, 'dashboard');
    return deleted;
  }
}
