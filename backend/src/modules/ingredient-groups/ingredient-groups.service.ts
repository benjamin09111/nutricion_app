import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tag } from '@prisma/client';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class IngredientGroupsService {
    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService
    ) { }



    async create(nutritionistId: string, createDto: CreateIngredientGroupDto) {
        const { tags, ingredients, type, ...data } = createDto;

        // Resolve tags (create if not exists)
        const tagRecords = tags && tags.length > 0
            ? await Promise.all(tags.map((name: string) => this.getOrCreateTag(name)))
            : [];

        const group = await this.prisma.ingredientGroup.create({
            data: {
                ...data,
                type: type || 'INGREDIENT',
                nutritionist: { connect: { id: nutritionistId } },
                tags: {
                    connect: tagRecords.map((t: Tag) => ({ id: t.id }))
                },
                entries: ingredients ? {
                    create: ingredients.map(ing => ({
                        ingredientId: ing.id,
                        brandSuggestion: ing.brandSuggestion,
                        amount: ing.amount,
                        unit: ing.unit
                    }))
                } : undefined
            },
            include: {
                tags: true,
                entries: {
                    include: {
                        ingredient: { select: { id: true, name: true, brand: true } },
                        recipe: { select: { id: true, name: true, calories: true, proteins: true, carbs: true, lipids: true, portions: true, imageUrl: true } }
                    }
                },
                _count: { select: { entries: true } }
            }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'ingredient-groups');
        return group;
    }

    async findAll(nutritionistId: string, type?: string) {
        const where: any = { nutritionistId };
        if (type) {
            where.type = type;
        }

        const groups = await this.prisma.ingredientGroup.findMany({
            where,
            include: {
                tags: true,
                entries: {
                    include: {
                        ingredient: {
                            include: {
                                brand: true,
                                category: true,
                                preferences: {
                                    where: { nutritionistId }
                                }
                            }
                        },
                        recipe: true
                    }
                },
                _count: { select: { entries: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return groups.map(group => ({
            ...group,
            ingredients: (group.entries || [])
                .filter(entry => entry.ingredient || entry.recipe)
                .map(entry => ({
                    ingredient: entry.ingredient || undefined,
                    recipe: entry.recipe || undefined,
                    brandSuggestion: entry.brandSuggestion,
                    amount: entry.amount,
                    unit: entry.unit,
                    entryId: entry.id
                }))
        }));
    }

    async findOne(id: string, nutritionistId: string) {
        const group = await this.prisma.ingredientGroup.findUnique({
            where: { id },
            include: {
                tags: true,
                entries: {
                    include: {
                        ingredient: {
                            include: {
                                brand: true,
                                category: true,
                                tags: true,
                                preferences: {
                                    where: { nutritionistId }
                                }
                            }
                        },
                        recipe: true
                    }
                },
                nutritionist: { select: { id: true } }
            }
        });

        if (!group) throw new NotFoundException('Group not found');
        if (group.nutritionistId !== nutritionistId) throw new ForbiddenException('Access denied');

        // Transform response to match expected frontend structure if needed, or update frontend
        // For now, returning raw structure but mapping entries to ingredients might be cleaner for frontend
        return {
            ...group,
            ingredients: (group.entries || [])
                .filter(entry => entry.ingredient || entry.recipe)
                .map(entry => ({
                    ingredient: entry.ingredient || undefined,
                    recipe: entry.recipe || undefined,
                    brandSuggestion: entry.brandSuggestion,
                    amount: entry.amount,
                    unit: entry.unit,
                    entryId: entry.id // Useful for specific removal
                }))
        };
    }

    private async validateGroupOwnership(id: string, nutritionistId: string) {
        if (!nutritionistId) throw new ForbiddenException('Nutritionist profile not found');

        const group = await this.prisma.ingredientGroup.findUnique({
            where: { id },
            include: { entries: true }
        });

        if (!group) throw new NotFoundException('Group not found');
        if (group.nutritionistId !== nutritionistId) throw new ForbiddenException('Access denied');
        return group;
    }

    async update(id: string, nutritionistId: string, updateDto: CreateIngredientGroupDto) {
        await this.validateGroupOwnership(id, nutritionistId);

        const { tags, ingredients, ...data } = updateDto;

        const tagRecords = tags
            ? await Promise.all(tags.map(name => this.getOrCreateTag(name)))
            : undefined;

        const updateData: any = { ...data };

        if (tags) {
            updateData.tags = {
                set: tagRecords?.map((t: Tag) => ({ id: t.id }))
            };
        }

        if (ingredients) {
            updateData.entries = {
                deleteMany: {}, // Clear existing
                create: ingredients.map(ing => ({
                    ingredientId: ing.id,
                    brandSuggestion: ing.brandSuggestion,
                    amount: ing.amount,
                    unit: ing.unit
                }))
            };
        }

        const group = await this.prisma.ingredientGroup.update({
            where: { id },
            data: updateData,
            include: { tags: true }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'ingredient-groups');
        return group;
    }

    async remove(id: string, nutritionistId: string) {
        await this.validateGroupOwnership(id, nutritionistId);
        const deleted = await this.prisma.ingredientGroup.delete({ where: { id } });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'ingredient-groups');
        return deleted;
    }

    async addIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto) {
        const group = await this.validateGroupOwnership(id, nutritionistId);
        const isRecipeGroup = group.type === 'RECIPE';
        const itemIds = isRecipeGroup ? (dto.recipeIds || []) : (dto.ingredientIds || []);
        if (itemIds.length === 0) return group;

        const updated = await this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    create: itemIds.map(itemId => ({
                        ...(isRecipeGroup ? { recipeId: itemId } : { ingredientId: itemId })
                    }))
                }
            },
            include: { _count: { select: { entries: true } } }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'ingredient-groups');
        return updated;
    }

    async removeIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto) {
        const group = await this.validateGroupOwnership(id, nutritionistId);
        const isRecipeGroup = group.type === 'RECIPE';
        const itemIds = isRecipeGroup ? (dto.recipeIds || []) : (dto.ingredientIds || []);
        if (itemIds.length === 0) return group;

        const updated = await this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    deleteMany: {
                        ...(isRecipeGroup ? { recipeId: { in: itemIds } } : { ingredientId: { in: itemIds } })
                    }
                }
            },
            include: { _count: { select: { entries: true } } }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'ingredient-groups');
        return updated;
    }

    // Helper
    private async getOrCreateTag(name: string) {
        return this.prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
}
