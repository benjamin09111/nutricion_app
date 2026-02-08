import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tag } from '@prisma/client';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';

@Injectable()
export class IngredientGroupsService {
    constructor(private prisma: PrismaService) { }

    private async getNutritionistId(accountId: string): Promise<string> {
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId },
            select: { id: true }
        });
        if (!nutritionist) throw new NotFoundException('Nutritionist profile not found');
        return nutritionist.id;
    }

    async create(accountId: string, createDto: CreateIngredientGroupDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        const { tags, ingredients, ...data } = createDto;

        // Resolve tags (create if not exists)
        const tagRecords = tags && tags.length > 0
            ? await Promise.all(tags.map((name: string) => this.getOrCreateTag(name)))
            : [];

        return this.prisma.ingredientGroup.create({
            data: {
                ...data,
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
                        ingredient: { select: { id: true, name: true, brand: true } }
                    }
                },
                _count: { select: { entries: true } }
            }
        });
    }

    async findAll(accountId: string) {
        const nutritionistId = await this.getNutritionistId(accountId);
        return this.prisma.ingredientGroup.findMany({
            where: {
                nutritionistId
            },
            include: {
                tags: true,
                _count: { select: { entries: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(id: string, accountId: string) {
        const nutritionistId = await this.getNutritionistId(accountId);
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
                        }
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
            ingredients: group.entries.map(entry => ({
                ...entry.ingredient,
                brandSuggestion: entry.brandSuggestion,
                amount: entry.amount,
                unit: entry.unit,
                entryId: entry.id // Useful for specific removal
            }))
        };
    }

    async update(id: string, accountId: string, updateDto: CreateIngredientGroupDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId); // Check ownership via findOne

        const { tags, ingredients, ...data } = updateDto;

        const tagRecords = tags
            ? await Promise.all(tags.map(name => this.getOrCreateTag(name)))
            : undefined;

        // If ingredients are provided, we replace all entries (common pattern for full update)
        // Or we could implement specific add/remove logic. For strict update, let's assume replacement or diff.
        // Given the DTO structure, if ingredients array is passed, it likely implies the new state.

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

        return this.prisma.ingredientGroup.update({
            where: { id },
            data: updateData,
            include: { tags: true }
        });
    }

    async remove(id: string, accountId: string) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId); // Check ownership
        return this.prisma.ingredientGroup.delete({ where: { id } });
    }

    async addIngredients(id: string, accountId: string, dto: UpdateGroupIngredientsDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);

        // This simplistic add assumes no extra data (brand/amount) for now as UpdateGroupIngredientsDto implies just IDs
        // If we want to support brand suggestions here, we'd need to update that DTO too.
        // For compatibility, we'll just add them with defaults.

        return this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    create: dto.ingredientIds.map(ingId => ({
                        ingredientId: ingId
                    }))
                }
            },
            include: { _count: { select: { entries: true } } }
        });
    }

    async removeIngredients(id: string, accountId: string, dto: UpdateGroupIngredientsDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);

        return this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    deleteMany: {
                        ingredientId: { in: dto.ingredientIds }
                    }
                }
            },
            include: { _count: { select: { entries: true } } }
        });
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
