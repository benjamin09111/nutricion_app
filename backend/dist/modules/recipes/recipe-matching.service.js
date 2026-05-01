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
    normalizeList(value) {
        if (!Array.isArray(value))
            return [];
        return Array.from(new Set(value
            .map((item) => (typeof item === 'string' ? (0, string_util_1.normalizeFoodName)(item) : ''))
            .filter(Boolean)));
    }
    getRecipeIngredientNames(recipe) {
        const relationNames = Array.isArray(recipe?.ingredients)
            ? recipe.ingredients
                .map((item) => item?.ingredient?.name || '')
                .filter(Boolean)
            : [];
        const metadata = recipe?.metadata || {};
        const customNames = this.normalizeList(metadata.customIngredientNames);
        const customIngredients = Array.isArray(metadata.customIngredients)
            ? metadata.customIngredients
                .map((item) => (typeof item?.name === 'string' ? item.name : ''))
                .filter(Boolean)
            : [];
        const rawIngredients = this.normalizeList(metadata.ingredients);
        return Array.from(new Set([...relationNames, ...customNames, ...customIngredients, ...rawIngredients]
            .map((item) => (0, string_util_1.normalizeFoodName)(item))
            .filter(Boolean)));
    }
    async findCompatibleRecipes(nutritionistId, ingredientNames, restrictions = []) {
        const normalizedInput = Array.from(new Set(ingredientNames.map(n => (0, string_util_1.normalizeFoodName)(n)).filter(Boolean)));
        if (normalizedInput.length === 0)
            return [];
        const recipes = await this.prisma.recipe.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { nutritionistId },
                    { savedBy: { some: { nutritionistId } } }
                ]
            },
            include: {
                ingredients: {
                    include: { ingredient: true }
                },
                nutritionist: { select: { fullName: true } },
                savedBy: {
                    where: { nutritionistId },
                    select: { id: true }
                }
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
            const relationMainIngredients = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.filter((ri) => ri.isMain)
                : [];
            const fallbackIngredientNames = this.getRecipeIngredientNames(recipe);
            const candidateMainIngredients = relationMainIngredients.length > 0
                ? relationMainIngredients.map((ri) => (0, string_util_1.normalizeFoodName)(ri.ingredient?.name || ''))
                : fallbackIngredientNames;
            if (candidateMainIngredients.length === 0)
                continue;
            let matchCount = 0;
            for (const recipeIngredient of candidateMainIngredients) {
                const normalizedRecipeReq = (0, string_util_1.normalizeFoodName)(recipeIngredient);
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
            const matchPercentage = (matchCount / candidateMainIngredients.length) * 100;
            if (matchPercentage >= 80) {
                scoredRecipes.push({
                    recipe,
                    matchPercentage,
                    matchCount,
                    totalMain: candidateMainIngredients.length
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
            isMine: sr.recipe.nutritionistId === nutritionistId,
            isAdopted: sr.recipe.nutritionistId !== nutritionistId && Array.isArray(sr.recipe.savedBy) && sr.recipe.savedBy.length > 0
        }));
    }
};
exports.RecipeMatchingService = RecipeMatchingService;
exports.RecipeMatchingService = RecipeMatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipeMatchingService);
//# sourceMappingURL=recipe-matching.service.js.map