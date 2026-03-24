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
exports.DietService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DietService = class DietService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeText(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
    heuristicVerify(foods, restrictions) {
        const rules = [
            {
                matchRestriction: /(diabet|resistencia insulin|insulina)/i,
                forbiddenWords: ['azucar', 'dulce', 'miel', 'jarabe', 'gaseosa'],
                reason: 'Alimento alto en azucares simples para contexto diabetico.',
                severity: 'high',
            },
            {
                matchRestriction: /(hipertension|hipertenso|sodio|presion alta)/i,
                forbiddenWords: ['embutido', 'salchicha', 'tocino', 'sopa instantanea', 'snack salado'],
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
                forbiddenWords: ['pollo', 'carne', 'cerdo', 'atun', 'pescado', 'marisco'],
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
        const conflicts = [];
        restrictions.forEach((restriction) => {
            const normalizedRestriction = this.normalizeText(restriction);
            const applicableRules = rules.filter((rule) => rule.matchRestriction.test(normalizedRestriction));
            foods.forEach((food) => {
                const normalizedFood = this.normalizeText(food.name);
                applicableRules.forEach((rule) => {
                    const matchedForbidden = rule.forbiddenWords.find((word) => normalizedFood.includes(word));
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
        const uniqueMap = new Map();
        conflicts.forEach((conflict) => {
            const key = `${conflict.foodId}::${conflict.restriction}::${conflict.reason}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, conflict);
            }
        });
        return Array.from(uniqueMap.values());
    }
    async verifyWithOpenAI(foods, restrictions) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
            return null;
        const prompt = [
            'Eres un validador nutricional estricto.',
            'Revisa si los alimentos entran en conflicto con las restricciones.',
            'Responde SOLO JSON valido con la forma:',
            '{"conflicts":[{"foodName":"", "restriction":"", "reason":"", "severity":"low|medium|high"}]}',
            `Restricciones: ${JSON.stringify(restrictions)}`,
            `Alimentos: ${JSON.stringify(foods.map((food) => food.name))}`,
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
                    temperature: 0.1,
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un asistente clinico de apoyo para nutricionistas. Evalua incompatibilidades de alimentos.',
                        },
                        { role: 'user', content: prompt },
                    ],
                }),
            });
            if (!response.ok)
                return null;
            const json = (await response.json());
            const content = json.choices?.[0]?.message?.content;
            if (!content)
                return null;
            const parsed = JSON.parse(content);
            const conflicts = (parsed.conflicts || [])
                .map((entry) => {
                const food = foods.find((candidate) => this.normalizeText(candidate.name) ===
                    this.normalizeText(entry.foodName));
                if (!food)
                    return null;
                return {
                    foodId: food.id,
                    foodName: food.name,
                    restriction: entry.restriction,
                    reason: entry.reason,
                    severity: entry.severity || 'medium',
                };
            })
                .filter((entry) => entry !== null);
            return conflicts;
        }
        catch {
            return null;
        }
    }
    async verifyFoodsAgainstRestrictions(body) {
        const foods = await this.prisma.ingredient.findMany({
            where: { id: { in: body.foodIds } },
            select: { id: true, name: true },
        });
        const openAiConflicts = await this.verifyWithOpenAI(foods, body.restrictions);
        const conflicts = openAiConflicts ?? this.heuristicVerify(foods, body.restrictions);
        const conflictedFoodIds = new Set(conflicts.map((conflict) => conflict.foodId));
        const safeFoods = foods
            .filter((food) => !conflictedFoodIds.has(food.id))
            .map((food) => food.name);
        return {
            ok: conflicts.length === 0,
            source: openAiConflicts ? 'openai' : 'heuristic',
            checkedFoods: foods.length,
            checkedRestrictions: body.restrictions.length,
            conflicts,
            safeFoods,
            summary: conflicts.length === 0
                ? 'No se detectaron conflictos directos con las restricciones seleccionadas.'
                : `Se detectaron ${conflicts.length} posibles conflictos para revisar.`,
        };
    }
};
exports.DietService = DietService;
exports.DietService = DietService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DietService);
//# sourceMappingURL=diet.service.js.map