import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';
import { GenerateBaseDietDto } from './dto/generate-base-diet.dto';
import { AiService } from '../../common/services/ai.service';
import { PlanUsageService } from '../permissions/plan-usage.service';
import { dietVerifyResponseSchema, dietGenerateBaseResponseSchema } from './diet-ai-schemas';

type RestrictionConflict = {
  foodId: string;
  foodName: string;
  restriction: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
};

type VerifyResponse = {
  ok: boolean;
  source: 'gemini' | 'deepseek' | 'openai' | 'heuristic';
  checkedFoods: number;
  checkedRestrictions: number;
  conflicts: RestrictionConflict[];
  safeFoods: string[];
  summary: string;
};

@Injectable()
export class DietService {
  private readonly logger = new Logger(DietService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private heuristicVerify(
    foods: Array<{ id: string; name: string }>,
    restrictions: string[],
  ): RestrictionConflict[] {
    const rules: Array<{
      matchRestriction: RegExp;
      forbiddenWords: string[];
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }> = [
      {
        matchRestriction: /(diabet|resistencia insulin|insulina)/i,
        forbiddenWords: ['azucar', 'dulce', 'miel', 'jarabe', 'gaseosa'],
        reason: 'Alimento alto en azucares simples para contexto diabetico.',
        severity: 'high',
      },
      {
        matchRestriction: /(hipertension|hipertenso|sodio|presion alta)/i,
        forbiddenWords: [
          'embutido',
          'salchicha',
          'tocino',
          'sopa instantanea',
          'snack salado',
        ],
        reason: 'Puede elevar carga de sodio en hipertension.',
        severity: 'high',
      },
      {
        matchRestriction: /(celiac|sin gluten|gluten)/i,
        forbiddenWords: ['trigo', 'cebada', 'centeno', 'pan', 'pasta'],
        reason: 'Posible fuente de gluten para restriccion celiaca.',
        severity: 'high',
      },
      {
        matchRestriction: /(vegetarian|vegano)/i,
        forbiddenWords: [
          'pollo',
          'carne',
          'cerdo',
          'atun',
          'pescado',
          'marisco',
        ],
        reason: 'Origen animal para patron vegetariano/vegano.',
        severity: 'medium',
      },
      {
        matchRestriction: /(renal|rinon)/i,
        forbiddenWords: ['embutido', 'queso curado', 'snack salado'],
        reason: 'Potencialmente alto sodio para contexto renal.',
        severity: 'medium',
      },
    ];

    const conflicts: RestrictionConflict[] = [];

    restrictions.forEach((restriction) => {
      const normalizedRestriction = this.normalizeText(restriction);
      const applicableRules = rules.filter((rule) =>
        rule.matchRestriction.test(normalizedRestriction),
      );

      foods.forEach((food) => {
        const normalizedFood = this.normalizeText(food.name);
        applicableRules.forEach((rule) => {
          const matchedForbidden = rule.forbiddenWords.find((word) =>
            normalizedFood.includes(word),
          );
          if (matchedForbidden) {
            conflicts.push({
              foodId: food.id,
              foodName: food.name,
              restriction,
              reason: `${rule.reason} Coincidencia detectada: "${matchedForbidden}".`,
              severity: rule.severity,
            });
          }
        });
      });
    });

    const uniqueMap = new Map<string, RestrictionConflict>();
    conflicts.forEach((conflict) => {
      const key = `${conflict.foodId}::${conflict.restriction}::${conflict.reason}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, conflict);
      }
    });
    return Array.from(uniqueMap.values());
  }

  private async verifyWithAi(
    accountId: string,
    foods: Array<{ id: string; name: string }>,
    restrictions: string[],
  ): Promise<{
    conflicts: RestrictionConflict[];
    provider: 'gemini' | 'deepseek' | 'openai';
  } | null> {
    const prompt = [
      'Eres un validador nutricional estricto.',
      'Revisa si los alimentos entran en conflicto con las restricciones.',
      'Responde SOLO JSON valido con la forma:',
      '{"conflicts":[{"foodName":"", "restriction":"", "reason":"", "severity":"low|medium|high"}]}',
      `Restricciones: ${JSON.stringify(restrictions)}`,
      `Alimentos: ${JSON.stringify(foods.map((food) => food.name))}`,
    ].join('\n');

    let quotaReserved = false;
    try {
      await this.planUsageService.consumeQuota(accountId, 'ai.calls.limit');
      quotaReserved = true;
      const result = await this.aiService.generateStructuredObject(
        'diet.verify-foods',
        'Eres un asistente clinico de apoyo para nutricionistas. Evalua incompatibilidades de alimentos.',
        prompt,
        dietVerifyResponseSchema,
        { accountId, feature: 'diet.verify-foods' },
      );
      const conflicts = (result.object.conflicts || [])
        .map((entry) => {
          const food = foods.find(
            (candidate) =>
              this.normalizeText(candidate.name) ===
              this.normalizeText(entry.foodName),
          );
          if (!food) return null;
          return {
            foodId: food.id,
            foodName: food.name,
            restriction: entry.restriction,
            reason: entry.reason,
            severity: entry.severity || 'medium',
          } satisfies RestrictionConflict;
        })
        .filter((entry): entry is RestrictionConflict => entry !== null);

      return { conflicts, provider: result.provider };
    } catch {
      if (quotaReserved) {
        await this.planUsageService.refundQuota(accountId, 'ai.calls.limit');
      }
      return null;
    }
  }

  async verifyFoodsAgainstRestrictions(
    accountId: string,
    body: VerifyFoodsDto,
  ): Promise<VerifyResponse> {
    const foods = await this.prisma.ingredient.findMany({
      where: { id: { in: body.foodIds } },
      select: { id: true, name: true },
    });

    const aiResult = await this.verifyWithAi(
      accountId,
      foods,
      body.restrictions,
    ).catch(() => null);
    const conflicts =
      aiResult?.conflicts ?? this.heuristicVerify(foods, body.restrictions);

    const conflictedFoodIds = new Set(
      conflicts.map((conflict) => conflict.foodId),
    );
    const safeFoods = foods
      .filter((food) => !conflictedFoodIds.has(food.id))
      .map((food) => food.name);

    return {
      ok: conflicts.length === 0,
      source: aiResult?.provider ?? 'heuristic',
      checkedFoods: foods.length,
      checkedRestrictions: body.restrictions.length,
      conflicts,
      safeFoods,
      summary:
        conflicts.length === 0
          ? 'No se detectaron conflictos directos con las restricciones seleccionadas.'
          : `Se detectaron ${conflicts.length} posibles conflictos para revisar.`,
    };
  }

  async generateBaseDiet(accountId: string, dto: GenerateBaseDietDto) {
    const { instructions = '', categories, maxFoodsPerCategory = 3 } = dto;

    const prompt = [
      'Eres Naty, la nutricionista asistente de NutriNet en Chile.',
      'Tu objetivo es seleccionar la mejor combinación de alimentos saludables para estructurar una pauta alimentaria base.',
      `Categorías de alimentos solicitadas a completar: ${JSON.stringify(categories)}`,
      `Cantidad de alimentos por categoría: MÍNIMO 1 alimento y MÁXIMO ${maxFoodsPerCategory} alimentos.`,
      instructions ? `Instrucciones clínicas o preferencias especiales del nutricionista: "${instructions}"` : '',
      'Reglas OBLIGATORIAS:',
      `1. Para CADA categoría solicitada en la lista, DEBES incluir al menos 1 alimento relevante y máximo ${maxFoodsPerCategory} alimentos típicos del catálogo de Chile (ej: Leche descremada con Vit. D, Yogurt Natural, Queso Gouda, Pechuga de pollo sin piel, Vacuno posta, Salmón, Avena, Manzana, Palta, Almendras, etc.).`,
      '2. NUNCA dejes una categoría solicitada con lista vacía []; todas las categorías solicitadas deben incluir obligatoriamente entre 1 y el máximo de alimentos sugeridos.',
      '3. Responde ÚNICAMENTE con el esquema JSON estructurado.',
    ]
      .filter(Boolean)
      .join('\n');

    this.logger.log(
      `==================== [NATY DIAGNOSTIC LOG] ====================`,
    );
    this.logger.log(
      `[generateBaseDiet] Categorías solicitadas (${categories.length}): ${JSON.stringify(categories)}`,
    );
    this.logger.log(
      `[generateBaseDiet] Max alimentos por categoría: ${maxFoodsPerCategory}`,
    );

    await this.planUsageService.consumeQuota(accountId, 'ai.calls.limit');

    const result = await this.aiService.generateStructuredObject(
      'diet.generate-base',
      'Eres Naty, la nutricionista asistente experta de NutriNet para profesionales.',
      prompt,
      dietGenerateBaseResponseSchema,
      { accountId, feature: 'diet.generate-base' },
    );

    this.logger.log(`[generateBaseDiet] Provider de IA usado: ${result.provider}`);
    this.logger.log(
      `[generateBaseDiet] Categorías devueltas por Naty (${result.object?.categories?.length || 0}): ${JSON.stringify(result.object?.categories)}`,
    );
    this.logger.log(
      `==============================================================`,
    );

    return {
      ok: true,
      provider: result.provider,
      dietTitle: result.object?.dietTitle || 'Pauta Base Generada por Naty',
      summary: result.object?.summary || '',
      categories: result.object?.categories || [],
    };
  }
}
