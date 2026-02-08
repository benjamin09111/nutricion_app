import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tag } from '@prisma/client';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';

@Injectable()
export class IngredientGroupsService {
    constructor(private prisma: PrismaService) { }



    async create(nutritionistId: string, createDto: CreateIngredientGroupDto) {
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

    async findAll(nutritionistId: string) {
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
            ingredients: (group.entries || [])
                .filter(entry => entry.ingredient)
                .map(entry => ({
                    ingredient: entry.ingredient,
                    brandSuggestion: entry.brandSuggestion,
                    amount: entry.amount,
                    unit: entry.unit,
                    entryId: entry.id // Useful for specific removal
                }))
        };
    }

    private async validateGroupOwnership(id: string, nutritionistId: string): Promise<void> {
        if (!nutritionistId) throw new ForbiddenException('Nutritionist profile not found');

        const group = await this.prisma.ingredientGroup.findUnique({
            where: { id },
            select: { nutritionistId: true }
        });

        if (!group) throw new NotFoundException('Group not found');
        if (group.nutritionistId !== nutritionistId) throw new ForbiddenException('Access denied');

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

        return this.prisma.ingredientGroup.update({
            where: { id },
            data: updateData,
            include: { tags: true }
        });
    }

    async remove(id: string, nutritionistId: string) {
        await this.validateGroupOwnership(id, nutritionistId);
        return this.prisma.ingredientGroup.delete({ where: { id } });
    }

    async addIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto) {
        await this.validateGroupOwnership(id, nutritionistId);

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

    async removeIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto) {
        await this.validateGroupOwnership(id, nutritionistId);

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
