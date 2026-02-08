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
let RecipesService = class RecipesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
        const nutritionistId = await this.getNutritionistId(userId);
        const { ingredients, ...data } = createDto;
        let calcMacros = {
            calories: data.calories || 0,
            proteins: data.proteins || 0,
            carbs: data.carbs || 0,
            lipids: data.lipids || 0,
            fiber: 0,
            sodium: 0
        };
        if (ingredients && ingredients.length > 0 && (!data.calories || !data.proteins)) {
            const ingredientIds = ingredients.map(i => i.ingredientId);
            const dbIngredients = await this.prisma.ingredient.findMany({
                where: { id: { in: ingredientIds } }
            });
            let totalCalories = 0;
            let totalProteins = 0;
            let totalCarbs = 0;
            let totalLipids = 0;
            ingredients.forEach(ing => {
                const dbIng = dbIngredients.find(d => d.id === ing.ingredientId);
                if (dbIng) {
                    const factor = ing.amount / 100;
                    totalCalories += dbIng.calories * factor;
                    totalProteins += dbIng.proteins * factor;
                    totalCarbs += dbIng.carbs * factor;
                    totalLipids += dbIng.lipids * factor;
                }
            });
            const portions = data.portions || 1;
            if (!data.calories)
                calcMacros.calories = parseFloat((totalCalories / portions).toFixed(2));
            if (!data.proteins)
                calcMacros.proteins = parseFloat((totalProteins / portions).toFixed(2));
            if (!data.carbs)
                calcMacros.carbs = parseFloat((totalCarbs / portions).toFixed(2));
            if (!data.lipids)
                calcMacros.lipids = parseFloat((totalLipids / portions).toFixed(2));
        }
        return this.prisma.recipe.create({
            data: {
                ...data,
                nutritionist: { connect: { id: nutritionistId } },
                calories: data.calories ?? calcMacros.calories,
                proteins: data.proteins ?? calcMacros.proteins,
                carbs: data.carbs ?? calcMacros.carbs,
                lipids: data.lipids ?? calcMacros.lipids,
                ingredients: ingredients ? {
                    create: ingredients.map(ing => ({
                        ingredientId: ing.ingredientId,
                        amount: ing.amount,
                        unit: ing.unit,
                        brandSuggestion: ing.brandSuggestion
                    }))
                } : undefined
            },
            include: {
                ingredients: {
                    include: { ingredient: true }
                }
            }
        });
    }
    async findAll(userId) {
        try {
            const nutritionistId = await this.getNutritionistId(userId);
            return this.prisma.recipe.findMany({
                where: {
                    OR: [
                        { isPublic: true },
                        { nutritionistId }
                    ]
                },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
        }
        catch (error) {
            return this.prisma.recipe.findMany({
                where: { isPublic: true },
                include: {
                    _count: { select: { ingredients: true } },
                    nutritionist: { select: { fullName: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
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
    async update(id, userId, updateDto) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);
        if (recipe.nutritionistId !== nutritionistId)
            throw new common_1.ForbiddenException('Cannot edit public or others recipes');
        const { ingredients, ...data } = updateDto;
        const updateData = { ...data };
        if (ingredients) {
            updateData.ingredients = {
                deleteMany: {},
                create: ingredients.map(ing => ({
                    ingredientId: ing.ingredientId,
                    amount: ing.amount,
                    unit: ing.unit,
                    brandSuggestion: ing.brandSuggestion
                }))
            };
        }
        return this.prisma.recipe.update({
            where: { id },
            data: updateData,
            include: { ingredients: true }
        });
    }
    async remove(id, userId) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);
        if (recipe.nutritionistId !== nutritionistId)
            throw new common_1.ForbiddenException('Cannot delete public or others recipes');
        return this.prisma.recipe.delete({ where: { id } });
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map