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
exports.RecipeMatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const string_util_1 = require("../../common/utils/string.util");
let RecipeMatchingService = class RecipeMatchingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findCompatibleRecipes(nutritionistId, ingredientNames, restrictions = []) {
        const normalizedInput = Array.from(new Set(ingredientNames.map(n => (0, string_util_1.normalizeFoodName)(n)).filter(Boolean)));
        if (normalizedInput.length === 0)
            return [];
        const recipes = await this.prisma.recipe.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { nutritionistId }
                ]
            },
            include: {
                ingredients: {
                    include: { ingredient: true }
                },
                nutritionist: { select: { fullName: true } }
            }
        });
        const scoredRecipes = [];
        for (const recipe of recipes) {
            let meetsRestrictions = true;
            const metaTags = recipe.metadata?.tags || [];
            if (restrictions && restrictions.length > 0) {
                const recipeTags = metaTags.map((t) => (0, string_util_1.normalizeFoodName)(t));
                for (const rest of restrictions) {
                    const normalizedRest = (0, string_util_1.normalizeFoodName)(rest);
                    if (!recipeTags.includes(normalizedRest)) {
                        meetsRestrictions = false;
                        break;
                    }
                }
            }
            if (!meetsRestrictions)
                continue;
            const mainIngredients = recipe.ingredients.filter(ri => ri.isMain);
            if (mainIngredients.length === 0)
                continue;
            let matchCount = 0;
            for (const ri of mainIngredients) {
                const normalizedRecipeReq = (0, string_util_1.normalizeFoodName)(ri.ingredient.name);
                let hasMatch = false;
                for (const input of normalizedInput) {
                    if (input === normalizedRecipeReq || input.includes(normalizedRecipeReq) || normalizedRecipeReq.includes(input)) {
                        hasMatch = true;
                        break;
                    }
                }
                if (hasMatch) {
                    matchCount++;
                }
            }
            const matchPercentage = (matchCount / mainIngredients.length) * 100;
            if (matchPercentage >= 80) {
                scoredRecipes.push({
                    recipe,
                    matchPercentage,
                    matchCount,
                    totalMain: mainIngredients.length
                });
            }
        }
        return scoredRecipes
            .sort((a, b) => {
            if (b.matchPercentage !== a.matchPercentage)
                return b.matchPercentage - a.matchPercentage;
            return b.totalMain - a.totalMain;
        })
            .map(sr => ({
            ...sr.recipe,
            matchPercentage: Math.round(sr.matchPercentage),
            isMine: sr.recipe.nutritionistId === nutritionistId
        }));
    }
};
exports.RecipeMatchingService = RecipeMatchingService;
exports.RecipeMatchingService = RecipeMatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipeMatchingService);
//# sourceMappingURL=recipe-matching.service.js.map