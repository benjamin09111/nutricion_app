import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
    constructor(private readonly prisma: PrismaService) { }

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

    async create(userId: string, createDto: CreateRecipeDto) {
        const nutritionistId = await this.getNutritionistId(userId);
        const { ingredients, ...data } = createDto;

        // Calculate Macros if not provided
        let calcMacros = {
            calories: data.calories || 0,
            proteins: data.proteins || 0,
            carbs: data.carbs || 0,
            lipids: data.lipids || 0,
            fiber: 0,
            sodium: 0
        };

        if (ingredients && ingredients.length > 0 && (!data.calories || !data.proteins)) {
            // Fetch ingredients to calculate
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

            // If user didn't override, use calculated totals divided by portions
            // Schema has "Total Macros per portion".
            const portions = data.portions || 1;

            if (!data.calories) calcMacros.calories = parseFloat((totalCalories / portions).toFixed(2));
            if (!data.proteins) calcMacros.proteins = parseFloat((totalProteins / portions).toFixed(2));
            if (!data.carbs) calcMacros.carbs = parseFloat((totalCarbs / portions).toFixed(2));
            if (!data.lipids) calcMacros.lipids = parseFloat((totalLipids / portions).toFixed(2));
        }

        return this.prisma.recipe.create({
            data: {
                ...data,
                nutritionist: { connect: { id: nutritionistId } },
                // Use calculated macros if overrides are missing
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

    async findAll(userId: string) {
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
        } catch (error) {
            // If nutritionist profile not found, return only public recipes
            // or return empty if we want strictness. But likely better to show public ones.
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

    async update(id: string, userId: string, updateDto: CreateRecipeDto) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);

        if (recipe.nutritionistId !== nutritionistId) throw new ForbiddenException('Cannot edit public or others recipes');

        const { ingredients, ...data } = updateDto;

        // Recalculate macros if ingredients provided... (simplified for now: trust DTO or old logic)
        // For MVP, lets assume if they update, they might need to update macros manually OR we recalc.
        // Implementing recalc logic here duplication... should extract method.
        // For now, let's just update fields.

        const updateData: any = { ...data };

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
            // Ideally re-calc macros here if not provided in DTO
        }

        return this.prisma.recipe.update({
            where: { id },
            data: updateData,
            include: { ingredients: true }
        });
    }

    async remove(id: string, userId: string) {
        const nutritionistId = await this.getNutritionistId(userId);
        const recipe = await this.findOne(id, userId);

        if (recipe.nutritionistId !== nutritionistId) throw new ForbiddenException('Cannot delete public or others recipes');

        return this.prisma.recipe.delete({ where: { id } });
    }
}
